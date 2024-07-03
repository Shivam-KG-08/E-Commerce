const mongoose = require("mongoose");

const prdSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
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
  },
  { versionKey: false }
);

const brandSchema = new mongoose.Schema(
  {
    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
    },
    name: {
      type: String,
      required: true,
    },

    product: [prdSchema],
  },
  { versionKey: false }
);

const subCategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    title: {
      type: String,
      required: true,
    },

    Brand: [brandSchema],
  },
  { versionKey: false }
);

const categorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    subCategory: [subCategorySchema],
  },
  { versionKey: false }
);

const Category = new mongoose.model("category", categorySchema);
const Subcategory = new mongoose.model("subcategory", subCategorySchema);
const Brand = new mongoose.model("brand", brandSchema);
const Prd = new mongoose.model("prd", prdSchema);

module.exports = { Category, Subcategory, Brand, Prd };
