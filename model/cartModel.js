const mongoose = require("mongoose");

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

      name: {
        type: String,
        required: true,
      },

      price: {
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
      "Cancelled",
      "Completed",
      "Failed",
    ],
    default: "Processing",
    required: true,
  },

  grandTotal: {
    type: Number,
    required: true,
  },

  isReserved: {
    type: Boolean,
    required: true,
    default: false,
  },

  isCheckout : {
    type : Boolean,
    required : true,
    default : false,
  }
  
});

//Executes before .save() or .create() before saved in to database
CartSchema.pre("save", function (next) {
  // console.log(this);   // here this represent to the current document
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
  return (cart.grandTotal = Number(total));
};

const Cart = mongoose.model("cart", CartSchema);

module.exports = Cart;
