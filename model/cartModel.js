const mongoose = require("mongoose");
const User = require("./userModel");
const CartSchema = new mongoose.Schema(
  {
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
          required: [true, "Product name is required"],
        },

        productPrice: {
          type: Number,
          required: [true, "Product price is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Product quantity field is required"],
        },

        subTotal: {
          type: Number,
          required: true,
        },
        isReserved: {
          type: Boolean,
          required: true,
          default: false,
        },
      },
    ],
    status: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Completed",
        "Failed",
      ],
      default: "Processing",
      required: true,
    },

    grandTotal: {
      type: Number,
      required: [true, "Grand total field is required"],
    },

    isComplete: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { versionKey: false }
);

//Executes before .save() or .create() before saved in to database
CartSchema.pre("save", function (next) {
  // console.log(this);   // here this represent to the current document
  // console.log("saved to database");
  next();
});

CartSchema.pre("findOne", function (next) {
  this.startTime = Date.now();
  // console.log("Query middlware pre");
  // console.log(this.getQuery());    // here this represent to the query object
  next();
});

CartSchema.post("findOne", function (docs, next) {
  this.endTime = Date.now();
  // console.log("Query middlware post");
  console.log(
    `${this.endTime - this.startTime} millseconds takes to execute query`
  );
  next();
});

CartSchema.methods.calculateGrandTotal = (cart) => {
  let total = 0;
  for (let i = 0; i < cart.items.length; i++) {
    total += cart.items[i].subTotal;
  }
  return (cart.grandTotal = total);
};

const Cart = mongoose.model("cart", CartSchema);

module.exports = Cart;
