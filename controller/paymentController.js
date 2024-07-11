const sentMail = require("../config/mailer");
const refundMail = require("../config/refundMail");
const Cart = require("../model/cartModel");
const { Prd } = require("../model/categoryModel");
const Order = require("../model/orderModel");
const Payment = require("../model/paymentModel");
const Reserve = require("../model/reserveModel");
const User = require("../model/userModel");
const CustomError = require("../utility/CustomError");
const stripe = require("stripe")(process.env.SECRET_KEY);

//checkout handler (when this route hit items quantity are descrese in to inventory)
module.exports.checkoutHandler = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.locals._id });
    cart.isReserved = false;

    let cartProduct = cart.items;

    cartProduct.map((i) => {
      return (i.isReserved = false);
    });
    await cart.save();

    if (!cart) {
      return next(new CustomError("Cart not found", 404));
    }

    if (cart.items.length == 0) {
      return res.status(404).json({
        status: "error",
        message: "Please add item in to cart then complete payment",
      });
    }

    let reserveCart = await Reserve.findOne({ cartId: cart._id });

    if (reserveCart) {
      // Filter out items with quantity 0
      reserveCart.items = reserveCart.items.filter(
        (item) => item.quantity !== 0
      );

      // Update quantities or add new items
      cartProduct.forEach((cartItem) => {
        const existingItem = reserveCart.items.find(
          (item) => item.productId.toString() === cartItem.productId.toString()
        );
        if (existingItem) {
          existingItem.quantity = cartItem.quantity;
        } else {
          reserveCart.items.push({
            productId: cartItem.productId,
            quantity: cartItem.quantity,
          });
        }
      });
      reserveCart.sessionFailed = false;
      // Save the updated reserve cart
      await reserveCart.save();
      console.log("Updated reserve cart:", reserveCart);
    } else {
      // Create a new reserve cart
      const reserveItems = cartProduct.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));

      const reserve = await Reserve.create({
        userId: req.locals._id,
        cartId: cart._id,
        items: reserveItems,
        grandTotal: cart.grandTotal,
      });

      console.log("New reserve cart:", reserve);
    }

    //item quantity descrese code
    cartProduct.map(async (i) => {
      let prds = await Prd.findOne({ _id: i.productId });
      prds.quantity = prds.quantity - i.quantity;
      await prds.save();
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
          cartId: cart.id.toString(),
          cartItems: JSON.stringify(cart.items),
        },
      });
      customerId = customer.id;
    }

    const lineItems = cartProduct.map((item) => ({
      price_data: {
        currency: "INR",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100,
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

    setTimeout(async () => {
      const ses = await stripe.checkout.sessions.retrieve(session.id);

      if (ses.status === "open") {
        const expiredSession = await stripe.checkout.sessions.expire(ses.id);
      } else {
        console.log(`Cannot expire session with status: ${session.status}`);
      }
    }, 300 * 1000); //30 minutes

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

    await Reserve.findOneAndDelete({ cartId: req.params.id });

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
    const cart = await Cart.findById(req.params.id);
    cart.isReserved = true;

    cart.items.map((i) => {
      return (i.isReserved = true);
    });

    await cart.save();

    const reserve = await Reserve.findOne({ cartId: req.params.id });

    if (reserve && !reserve.sessionFailed) {
      // Mark the session as failed
      reserve.sessionFailed = true;

      // Update product quantities and set reserve item quantities to zero
      for (const item of reserve.items) {
        const product = await Prd.findById(item.productId);
        if (product) {
          product.quantity += item.quantity;
          item.quantity = 0;
          await product.save();
        }
      }

      // Save the updated reserve document
      await reserve.save();

      console.log(
        "Reserve session marked as failed and quantities updated:",
        reserve
      );
    } else {
      console.log("Reserve session not found or already marked as failed.");
    }

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
        cartId: customer.metadata.cartId,
        customerId: data.customer,
        paymentIntentId: data.id,
        products,
        total: data.amount / 100,
        shipping: data.shipping,
        // status: data.payment_status,
      });

      const savedOrders = await newOrder.save();
      console.log("Order : ", savedOrders);

      return savedOrders;
    } catch (error) {
      console.log(error);
    }
  };

  const backToInventory = async (customer) => {
    const reserve = await Reserve.findOne({ userId: customer.metadata.userId });

    //this endpoints hit when user does not perform checkout payment either success or failure
    if (reserve && !reserve.sessionFailed) {
      let reserveProduct = reserve.items;
      console.log("Session has expired"); // if (!cart.isReserved) {
      // cart.isReserved = true;
      reserveProduct.map(async (i) => {
        // i.isReserved = true;
        let prds = await Prd.findOne({ _id: i.productId });
        prds.quantity = prds.quantity + i.quantity;
        await prds.save();
        i.quantity = 0;
      });
      // }
      // cart.status = "Pending";
      reserve.save();

      await Reserve.findOneAndDelete({ userId: customer.metadata.userId });
    } else {
      // console.log("pppppp");
      return;
    }
  };

  const cretePayment = async (data, orderId, customer) => {
    const payment_time = new Date(data.created * 1000);

    // const payment_time = paymentTime.toString();

    try {
      const payment = new Payment({
        userId: customer.metadata.userId,
        orderId,
        payment_intent: data.id,
        payment_time,
        payment_status: data.status,
        amount: data.amount / 100,
      });

      const savedPayment = await payment.save();
      console.log("Payment info : ", savedPayment);

      return savedPayment;
    } catch (error) {
      console.log(error);
      return res.status(400).json({
        status: "fails",
        error,
      });
    }
  };

  //this event triggers when payment_intent is succeedeed
  if (eventType === "payment_intent.succeeded") {
    stripe.customers
      .retrieve(data.customer)
      .then(async (customer) => {
        try {
          const order = await createOrder(customer, data);
          console.log("ordered created successfully");
          const orderId = order.id;
          console.log(orderId);

          await cretePayment(data, orderId, customer);
        } catch (error) {
          console.log(error);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  if (eventType === "charge.updated") {
    console.log(data);
    sentMail(data);
    Payment.findOneAndUpdate(
      { payment_intent: data.payment_intent },
      { chargeId: data.id },
      { new: true }
    ).then((result) => {
      console.log("poiu");
      console.log(result);
      console.log("lkjh");
    });
  }
  //this event triggers when card failed meands payment failed during card issues like card_declined , incoreece_cvc , expire etc reasons

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
            cartId: customer.metadata.cartId,
            customerId: data.customer,
            paymentIntentId: data.payment_intent,
            products,
            total: data.amount / 100,
            shipping: data.billing_details,
            status: "Failed",
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

  if (eventType === "checkout.session.completed") {
    stripe.customers
      .retrieve(data.customer)
      .then(async (customer) => {
        try {
          const userId = customer.metadata.userId;

          const user = await User.findOneAndUpdate(
            { _id: userId },
            { address: data.shipping_details.address },
            { new: true }
          );
        } catch (error) {
          console.log(error);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  //this event triggers when session is expired when it happpens item's back in to inventory
  if (eventType === "checkout.session.expired") {
    stripe.customers
      .retrieve(data.customer)
      .then(async (customer) => {
        try {
          await backToInventory(customer);
          console.log("Backed to inventory");
          return;
        } catch (error) {
          console.log(error);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  if (eventType === "charge.refunded") {
    console.log(data);
    Payment.findOneAndUpdate(
      { chargeId: data.id },
      { payment_status: "refunded" },
      { new: true }
    )
      .then((result) => {
        console.log(result);
        console.log("Updates status");

        refundMail(data);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
};
