const mongoose = require("mongoose");

const reserveSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],

  grandTotal: {
    type: Number,
    required: true,
  },

  sessionFailed: {
    type: Boolean,
    default: false,
  },
});

const Reserve = new mongoose.model("reserve", reserveSchema);
module.exports = Reserve;
