const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
  },
  itemQuantity: {
    type: Number,
    required: true,
  },
  itemTotalPrice: {
    type: Number,
    required: true,
  },
});

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    orderItems: [orderItemSchema],

    orderGrandTotal: {
      type: Number,
      required: [true, "orderGrandTotal is required field"],
    },
    orderStatus: {
      type: String,
      required: true,
    },

    userEmail: {
      type: String,
      required: true,
    },

    userName: {
      type: String,
      required: true,
    },
    shippingDetails: {
      city: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      line1: {
        type: String,
        required: true,
      },
      line2: {
        type: String,
        required: true,
      },
      postalCode: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
    },
  },
  { versionKey: false }
);

const Order = new mongoose.model("order", OrderSchema);

module.exports = Order;
