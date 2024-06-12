const mongoose = require("mongoose");
const User = require("../model/user");
const CartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },

      productName: {
        type: String,
        required: true,
      },

      productPrice: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },

      subTotal: {
        type: Number,
        required: true,
      },
    },
  ],
  status: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    default: "Processing",
    required: true,
  },

  grandTotal: {
    type: Number,
    required: true,
  },
});
//Executes before .save() or .create() before saved in to database
CartSchema.pre("save", function (next) {
  console.log(this);
  console.log("saved to database");
  next();
});

CartSchema.pre("findOne", function (next) {
  this.startTime = Date.now();
  console.log("Query middlware pre");
  console.log(this.getQuery());
  next();
});

CartSchema.post("findOne", function (docs, next) {
  this.endTime = Date.now();
  console.log("Query middlware post");

  console.log(
    `${this.endTime - this.startTime} millseconds takes to execute query`
  );
  next();
});

const Cart = mongoose.model("cart", CartSchema);

module.exports = Cart;
