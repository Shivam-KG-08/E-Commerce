const Order = require("../model/orderModel");
const CustomError = require("../utility/CustomError");
const sentMail = require("../config/mailer");
const Payment = require("../model/paymentModel");
const Product = require("../model/productModel");
const stripe = require("stripe")(process.env.SECRET_KEY);

module.exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.locals._id });
    if (!orders) {
      next(new CustomError("User has not done any orders till", 404));
    }
    return res.status(200).json({
      status: "success",
      orders,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};

module.exports.upadteOrderstatus = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);

    const payment = await Payment.findOne({ orderId });

    if (!order) {
      next(new CustomError("Order not found", 404));
    }

    if (order.status === "Processing") {
      if (req.body.status === "Cancelled") {
        for (let item of order.products) {
          let prds = await Product.findById(item.productId);
          prds.quantity += item.quantity;
          await prds.save();
        }
      }
      order.status = "Cancelled"; 
      await order.save();

      //sent cancellation mail
      sentMail({ payment_intent: order.paymentIntentId });

        const refund = await stripe.refunds.create({
          charge: payment.chargeId,
        });
    }

    return res.status(200).json({
      status: "success",
      Order: order,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};
