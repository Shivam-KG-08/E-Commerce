const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const User = require("../model/userModel");
// const Payment = require("../model/paymentModel");
const Order = require("../model/orderModel");

const registeredMail = async (req, res) => {
  let configuratiion = {
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS,
    },
  };

  let transporter = nodemailer.createTransport(configuratiion);

  const MailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "E-commerce",
      link: "https://mailgen.js",
    },
  });

  const order = await Order.findOne({
    paymentIntentId: req.payment_intent,
  });

  // const payment = await Payment.findOne({
  //   payment_intent: req.payment_intent,
  // });

  // console.log(payment);

  const user = await User.findById(order.userId);
  let refundReceipt = req.receipt_url;
  let email = {
    body: {
      name: user.userName,
      intro: [
        `We wanted to let you know that your order ${order.id} has been refunded.`,
        `Your refund for order ${order.id} has been processed. The amount of ${order.total} will be credited back to your account`,
      ],

      action: {
        instructions: "Click here to view receipt of refunded order",
        button: {
          color: "#22BC66",
          text: "View Receipt",
          link: refundReceipt,
        },
      },
      outro:
        "Thank you for shopping with us. We hope to serve you again in the future.",
    },
  };

  let emailBody = MailGenerator.generate(email);

  let message = {
    from: process.env.EMAIL,
    to: "bedogoh253@carspure.com",
    // to: user.email,
    subject: "Payment Refunded",
    html: emailBody,
  };

  transporter
    .sendMail(message)
    .then(() => {
      console.log("Email sent successFully");
    })
    .catch((error) => {
      console.log(error);
    });
};

module.exports = registeredMail;
