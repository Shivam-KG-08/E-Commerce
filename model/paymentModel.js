const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    payment_intent: {
      type: String,
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    chargeId: {
      type: String,
    },
    payment_time: {
      type: Date,
    },
    payment_status: {
      type: String,
      required: true,
    },
    payment_methods_details: {
      type: mongoose.Schema.Types.Mixed,
    },
    amount: {
      type: Number,
      required: true,
    },
    failer: {
      type: String,
    },
  },
  { versionKey: false }
);

const Payment = new mongoose.model("payment", paymentSchema);
module.exports = Payment;
