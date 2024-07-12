const mongoose = require("mongoose");

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

  },
  { versionKey: false }
);

const categorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
  },
  { versionKey: false }
);

const Category = new mongoose.model("category", categorySchema);
const Subcategory = new mongoose.model("subcategory", subCategorySchema);
const Brand = new mongoose.model("brand", brandSchema);


module.exports = { Category, Subcategory, Brand };
