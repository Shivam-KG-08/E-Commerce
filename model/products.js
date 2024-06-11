const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },

  productBrand: {
    type: String,
    required: true,
  },

  productPrice: {
    type: Number,
    required: true,
  },

  productQuantity: {
    type: Number,
    required: true,
  },
});

const Product = new mongoose.model("product", ProductSchema);
module.exports = Product;
