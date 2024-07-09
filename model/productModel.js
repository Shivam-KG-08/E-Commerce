const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    productCategories: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: [true, "Product name is required"],
    },

    productBrand: {
      type: String,
      required: [true, "Product brand field is required"],
    },

    productPrice: {
      type: Number,
      required: [true, "Product price is required"],
    },

    productQuantity: {
      type: Number,
      required: [true, "Product quantity field is required"],
    },
  },
  { versionKey: false }
);

const Product = mongoose.model("product", ProductSchema);
module.exports = Product;
