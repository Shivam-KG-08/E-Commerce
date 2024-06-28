const Cart = require("../model/cartModel");
const Order = require("../model/orderModel");
const Payment = require("../model/paymentModel");
const Product = require("../model/productModel");
const CustomError = require("../utility/CustomError");
const stripe = require("stripe")(process.env.SECRET_KEY);

//checkout handler (when this route hit items quantity are descrese in to inventory)
module.exports.checkoutHandler = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.locals._id });
    cart.isReserved = false;

    let cartProduct = cart.items;

    if (!cart) {
      return next(new CustomError("Cart not found", 404));
    }

    if (cart.items.length == 0) {
      return res.status(404).json({
        status: "error",
        message: "Please add item in to cart then complete payment",
      });
    }
    //item quantity descrese code
    cartProduct.map(async (i) => {
      let prd = await Product.findOne({ _id: i.productId });
      prd.productQuantity = prd.productQuantity - i.quantity;
      await prd.save();
    });

    //create customer and store metadata in to customer
    const customerOrder = await Order.findOne({ userId: req.locals._id });
    let customerId;
    if (customerOrder) {
      customerId = customerOrder.customerId;
    } else {
      const customer = await stripe.customers.create({
        metadata: {
          userId: req.locals._id.toString(),
          cartItems: JSON.stringify(cart.items),
        },
      });
      customerId = customer.id;
    }

    const lineItems = cartProduct.map((item) => ({
      price_data: {
        currency: "INR",
        product_data: {
          name: item.productName,
        },
        unit_amount: item.productPrice * 100,
      },
      quantity: item.quantity,
    }));

    //create checkout sessions

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      customer: customerId,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 30, //30 minutes
      shipping_address_collection: {
        allowed_countries: ["IN"],
      },
      success_url: `http://localhost:8080/api/v1/payment/success/${cart._id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:8080/api/v1/payment/cancel/${cart._id}`,
    });

    // if (!cart.isReserved) {
    //   console.log(cart.isReserved);
    //   console.log("Enter in to expire");
    setTimeout(async () => {
      const ses = await stripe.checkout.sessions.retrieve(session.id);
      // console.log(ses);
      // console.log("jhghcf");
      if (ses.status === "open") {
        // Expire the session
        const expiredSession = await stripe.checkout.sessions.expire(ses.id);
        // console.log("Session expired successfully:", expiredSession);
      } else {
        console.log(`Cannot expire session with status: ${session.status}`);
      }
    }, 120 * 1000); //30 minutes
    // }

    return res.status(200).json({
      status: "success",
      data: session,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};

//when payment is success then stripe redirect through success_url and perform operaton
module.exports.successPayment = async (req, res) => {
  try {
    const id = req.params.id;

    let cart = await Cart.findById(id);

    cart.items = [];
    cart.grandTotal = 0;

    cart.status = "Completed";
    cart.isReserved = false;

    await cart.save();

    return res.json({
      status: "success",
      message: "Payment succesfull",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: "fail",
      error,
    });
  }
};

//when payment is failed or cancel then stripe redirect through cancel and perform operaton
module.exports.cancelPayment = async (req, res) => {
  try {
    const id = req.params.id;
    let cart = await Cart.findById(id);

    cart.isReserved = true;

    let cartProduct = cart.items;

    // cartProduct.map(async (i) => {
    //   let prd = await Product.findOne({ _id: i.productId });

    // if (i.isReserved) {
    //   prd.productQuantity = prd.productQuantity + 0;
    //   await prd.save();
    // } else {
    // prd.productQuantity = prd.productQuantity + i.quantity;
    // await prd.save();
    // }
    // });

    cartProduct.map(async (i) => {
      i.isReserved = true;
    });

    await cart.save();

    //this code can help if any time failure happen we should identify which product is failed so change property isReserved = true

    return res.json({
      status: "fails",
      message: "Payment fails",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: "fail",
      error,
    });
  }
};

// webhook

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.API_KEY_WEBOOK;

module.exports.webHook = (req, res) => {
  const sig = req.headers["stripe-signature"];

  const rawBody = req.rawBody;
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    // console.log("After event");
  } catch (err) {
    console.log(err);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  let data = event.data.object;

  let eventType = event.type;

  const createOrder = async (customer, data) => {
    try {
      const Items = JSON.parse(customer.metadata.cartItems);

      const products = Items.map((item) => {
        return {
          productId: item.productId,
          quantity: item.quantity,
        };
      });

      const newOrder = new Order({
        userId: customer.metadata.userId,
        customerId: data.customer,
        paymentIntentId: data.id,
        products,
        total: data.amount / 100,
        shipping: data.shipping,
        // status: data.payment_status,
      });

      const savedOrders = await newOrder.save();
      console.log("Order : ", savedOrders);
    } catch (error) {
      console.log(error);
    }
  };

  const backToInventory = async (customer) => {
    const cart = await Cart.findOne({ userId: customer.metadata.userId });
    let cartProduct = cart.items;
    console.log("Session has expired"); // if (!cart.isReserved) {
    cart.isReserved = true;
    cartProduct.map(async (i) => {
      i.isReserved = true;
      let prd = await Product.findOne({ _id: i.productId });
      prd.productQuantity = prd.productQuantity + i.quantity;
      await prd.save();
    });
    // }
    cart.status = "Pending";
    cart.save();
  };

  const cretePayment = async (data, orderId, customer) => {
    const paymentTime = new Date(data.created * 1000);
    const payment_time = paymentTime.toString();

    try {
      const payment = new Payment({
        userId: customer.metadata.userId,
        orderId,
        payment_intent: data.id,
        payment_time: payment_time,
        payment_status: data.status,
        amount: data.amount / 100,
        // payment_methods_details: {
        //   type: data.payment_method_details.type,
        //   brand: data.payment_method_details.card.brand,
        //   exp_month: data.payment_method_details.card.exp_month,
        //   exp_year: data.payment_method_details.card.exp_year,
        //   last4Dig: data.payment_method_details.last4,
        //   funding: data.payment_method_details.funding,
        // },
      });

      const savedPayment = await payment.save();
      console.log("Payment info : ", savedPayment);
    } catch (error) {
      console.log(error);
      return res.status(400).json({
        status: "fails",
        error,
      });
    }
  };

  if (eventType === "checkout.session.completed") {
    // stripe.customers
    //   .retrieve(data.customer)
    //   .then(async (customer) => {
    //     try {
    //       await createOrder(customer, data);
    //       console.log("ordered created successfully");
    //       // return res.status(200).json({
    //       //   status: "Success",
    //       //   message: "Order created successfully",
    //       //   data: data,
    //       // });
    //     } catch (error) {
    //       console.log(error);
    //     }
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });
  }

  if (eventType === "checkout.session.expired") {
    stripe.customers
      .retrieve(data.customer)
      .then(async (customer) => {
        try {
          await backToInventory(customer);
          console.log("Backed to inventory");
        } catch (error) {
          console.log(error);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  if (eventType === "charge.succeeded") {
    console.log(data.receipt_url);
  }

  if (eventType === "payment_intent.succeeded") {
    stripe.customers
      .retrieve(data.customer)
      .then(async (customer) => {
        try {
          await createOrder(customer, data);
          console.log("ordered created successfully");

          const order = await Order.findOne({
            paymentIntentId: data.id,
          });
          console.log(order);
          const orderId = order._id;

          await cretePayment(data, orderId, customer);
        } catch (error) {
          console.log(error);
        }
      })
      .catch((err) => {
        console.log(err);
      });

    // stripe.customers
    //   .retrieve(data.customer)
    //   .then(async (customer) => {
    //     try {
    //       console.log("payment_Succeedde");
    //       console.log(data);

    // const order = await Order.findOne({
    //   paymentIntentId: data.id,
    // });
    // console.log(order);
    // const orderId = order._id;

    // await cretePayment(data, orderId, customer);
    // } catch (error) {
    //   console.log(error);
    // }
    // })
    // .catch((error) => {
    //   console.log(error);
    // });
  }

  // setTimeout(() => {
  //   if (eventType === "payment_intent.succeeded") {
  //     stripe.customers
  //       .retrieve(data.customer)
  //       .then(async (customer) => {
  //         try {
  //           console.log("payment_Succeedde");
  //           console.log(data);

  //           const order = await Order.findOne({
  //             paymentIntentId: data.id,
  //           });
  //           console.log(order);
  //           const orderId = order._id;

  //           await cretePayment(data, orderId, customer);
  //         } catch (error) {
  //           console.log(error);
  //         }
  //       })
  //       .catch((error) => {
  //         console.log(error);
  //       });
  //   }
  // }, 15000);

  if (eventType === "charge.failed") {
    stripe.customers
      .retrieve(data.customer)
      .then(async (customer) => {
        try {
          const Items = JSON.parse(customer.metadata.cartItems);

          const products = Items.map((item) => {
            return {
              productId: item.productId,
              quantity: item.quantity,
            };
          });

          const newOrder = new Order({
            userId: customer.metadata.userId,
            customerId: data.customer,
            paymentIntentId: data.payment_intent,
            products,
            total: data.amount / 100,
            shipping: data.billing_details,
            // status: data.payment_status,
          });

          const savedOrders = await newOrder.save();
          console.log("Order : ", savedOrders);

          const order = await Order.findOne({
            paymentIntentId: data.payment_intent,
          });

          const orderId = order._id;

          const paymentTime = new Date(data.created * 1000);
          const payment_time = paymentTime.toString();

          const payment = new Payment({
            userId: customer.metadata.userId,
            orderId,
            payment_intent: data.payment_intent,
            payment_time: payment_time,
            payment_status: data.status,
            amount: data.amount / 100,
            failer: data.failure_code,
          });

          const savedPayment = await payment.save();
          console.log("Payment info : ", savedPayment);
        } catch (error) {
          console.log(error);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
  // Return a 200 response to acknowledge receipt of the event

  res.send();
};
