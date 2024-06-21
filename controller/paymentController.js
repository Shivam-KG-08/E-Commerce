const Cart = require("../model/cartModel");
const Order = require("../model/orderModel");
const Product = require("../model/productModel");
const stripe = require("stripe")(process.env.SECRET_KEY);

//process payment

module.exports.checkoutPayment = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.locals._id });
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

    cartProduct.map(async (i) => {
      let prd = await Product.findOne({ _id: i.productId });
      prd.productQuantity = prd.productQuantity - i.quantity;
      await prd.save();
    });

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

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      expires_at: Math.floor(Date.now() / 1000) + 60 * 30,
      shipping_address_collection: {
        allowed_countries: ["IN"],
      },
      success_url: `http://localhost:8080/api/v1/payment/success/${cart._id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:8080/api/v1/payment/cancel/${cart._id}`,
    });

    console.log("aa");
    setTimeout(async () => {
      console.log("kk");
      if (!cart.isReserved) {
        cart.isReserved = true;
        console.log("back to invt");
        cartProduct.map(async (i) => {
          i.isReserved = true;
          let prd = await Product.findOne({ _id: i.productId });
          prd.productQuantity = prd.productQuantity + i.quantity;
          await prd.save();
        });
      }
      cart.status = "Pending";
      cart.save();
    }, 1800 * 1000); //30 minutes

    console.log("bb");

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

module.exports.successPayment = async (req, res) => {
  try {
    const id = req.params.id;

    let cart = await Cart.findById(id);

    const paymentIntent = await stripe.checkout.sessions.retrieve(
      req.query.session_id,
      {
        expand: ["payment_intent.payment_method"],
      }
    );
    const listItems = await stripe.checkout.sessions.listLineItems(
      req.query.session_id
    );
    console.log(listItems);
    let orderItems = listItems.data.map((i) => {
      return {
        itemName: i.description,
        itemQuantity: i.quantity,
        itemTotalPrice: i.amount_total / 100,
      };
    });

    const order = await Order.create({
      userId: cart.userId,
      orderItems,
      orderGrandTotal: cart.grandTotal,
      orderStatus: paymentIntent.payment_intent.status,
      userEmail: paymentIntent.customer_details.email,
      userName: paymentIntent.customer_details.name,
      shippingDetails: {
        city: paymentIntent.customer_details.address.city,
        country: paymentIntent.customer_details.address.country,
        line1: paymentIntent.customer_details.address.line1,
        line2: paymentIntent.customer_details.address.line2,
        postalCode: paymentIntent.customer_details.address.postal_code,
        state: paymentIntent.customer_details.address.state,
      },
    });

    console.log(order);

    // cart.isComplete = true;

    cart.items = [];
    cart.grandTotal = 0;

    cart.status = "Completed";

    await cart.save();

    res.json({
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
module.exports.cancelPayment = async (req, res) => {
  try {
    const id = req.params.id;

    let cart = await Cart.findById(id);

    let cartProduct = cart.items;

    cart.isReserved = true;

    cartProduct.map(async (i) => {
      let prd = await Product.findOne({ _id: i.productId });
      console.log(i);
      if (i.isReserved) {
        prd.productQuantity = prd.productQuantity + 0;
        await prd.save();
      } else {
        prd.productQuantity = prd.productQuantity + i.quantity;
        await prd.save();
      }
    });
    setTimeout(async () => {
      cartProduct.map(async (i) => {
        i.isReserved = true;
        console.log(i);
      });
      await cart.save();
    }, 5000);

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
const endpointSecret =
  "whsec_66da8d1c29e354d5dc726ad5c5d9eb1b65a7c08f96a0b562806400727ee28b73";

module.exports.webHook = (request, response) => {
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    console.log(event);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntentSucceeded = event.data.object;
      // Then define and call a function to handle the event payment_intent.succeeded
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
};
