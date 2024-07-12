const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const User = require("../model/userModel");
const Order = require("../model/orderModel");
const Payment = require("../model/paymentModel");

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
  // console.log(req);
  const order = await Order.findOne({
    paymentIntentId: req.payment_intent,
  });

  console.log("ooooo");
  console.log(order);
  const payment = await Payment.findOne({
    payment_intent: req.payment_intent,
  });
  console.log("ppppp");
  console.log(payment);

  const user = await User.findById(order.userId);

  let orderReceipt = req.receipt_url;

  let email = {
    body: {
      name: user.userName,
      intro: [
        order.status == "Processing"
          ? `Thank you for your purchase! Your order ${order.id} will be shipped within 1 days. We will send you an email as soon as your parcel is on its way \n \n \n`
          : [`We wanted to let you know that your order ${order.id} has been successfully canceled`,
            `We're sorry to see you go! Your order has been canceled as per your request. If you have already been charged, you will receive a full refund within the next 5-7 business days.`,]],

      action:
        order.status === "Processing"
          ? {
            instructions: "Click here to view receipt of order",
            button: {
              color: "#22BC66",
              text: "View Receipt",
              link: orderReceipt,
            },
          } : {
            instructions:
              "If you have any questions or need further assistance, please don't hesitate to contact us.",
            button: {
              color: "#22BC66",
              text: "Contact Support",
              link: "mailto:support@example.com",
            },
          },

      outro:
        order.status === "Processing"
          ? "Need help, or have questions? Just reply to this email, we'd love to help."
          : "Thank you for shopping with us. We hope to serve you again in the future.",
    },
  };

  let emailBody = MailGenerator.generate(email);

  let message = {
    from: process.env.EMAIL,
    to: "bedogoh253@carspure.com",
    // to: user.email,
    subject:
      order.status === "Processing"
        ? "Order Confirmation"
        : "Order Cancelation"
    ,
    html: emailBody,
  };

  transporter
    .sendMail(message)
    .then(() => {
      console.log("Mail sent successFully");
    })
    .catch((error) => {
      console.log(error);
    });
};

module.exports = registeredMail;
