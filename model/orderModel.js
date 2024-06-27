const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
});

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
    },

    customerId: {
      type: String,
    },
    paymentIntentId: {
      type: String,
    },

    products: [itemSchema],

    total: {
      type: Number,
      required: true,
    },

    shipping: {
      type: mongoose.Schema.Types.Mixed,
    },
    payment_status: {
      type: String,
      required: true,
    },
  },

  { versionKey: false }
);

const Order = new mongoose.model("order", OrderSchema);

module.exports = Order;
