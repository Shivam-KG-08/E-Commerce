const { Category, Subcategory, Brand } = require("../model/categoryModel");
const Product = require("../model/productModel");
const CustomError = require("../utility/CustomError");

module.exports.getAllProducts = async (req, res, next) => {
  try {
    let query = {};
    let limitDoc = req.query.limit;
    if (limitDoc <= 0) {
      return next(new CustomError("Enter valid limit", 400));
    }
    const page = req.query.page;

    if (page <= 0) {
      return next(new CustomError("Invalid page number", 400));
    }
    const offset = (page - 1) * limitDoc;

    if (req.query.price) {
      let queryStr = JSON.stringify(req.query.price);

      queryStr = queryStr.replace(
        /\b(gte|gt|lte|lt)\b/g,
        (match) => `$${match}`
      );

      let queryObj = JSON.parse(queryStr);
      query.price = queryObj;
    }

    if (req.query.category) {
      let cat = await Category.findOne({ title: req.query.category });
      if (cat) {
        query.categoryId = cat.id;
      } else {
        return res.status(404).json({
          status: "Fails",
          message: "Category not found",
        });
      }
    }

    if (req.query.subCategory) {
      let sub = await Subcategory.findOne({ title: req.query.subCategory });
      if (sub) {
        query.subCategoryId = sub.id;
      } else {
        return res.status(404).json({
          status: "Fails",
          message: "Subcategory not found",
        });
      }
    }

    if (req.query.brand) {
      let brd = await Brand.findOne({ name: req.query.brand });
      if (brd) {
        query.brandId = brd.id;
      } else {
        return res.status(404).json({
          status: "Fails",
          message: "Brand not found",
        });
      }
    }

    let srt;

    if (req.query.sort) {
      srt = req.query.sort.split(",").join(" ");
    }

    // console.log(query);
    const product = await Product.find(query)
      .skip(offset)
      .limit(limitDoc)
      .sort(srt);

    const result = product.length;

    if (product.length == 0) {
      return res.status(404).json({
        status: "Fails",
        message: "Not any product found",
      });
    }

    return res.status(200).json({
      status: "success",
      result,
      product,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};

module.exports.getProduct = async (req, res , next) => {
  try {
    const product = await Product.findById(req.params.id);

    if(!product){
     return next(new CustomError("Product not found" , 404));
    }

    return res.status(200).json({
      status: "Success",
      product,
    });

  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};

module.exports.createProduct = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);

    const subCate = await Subcategory.findById(brand.subCategoryId);

    if (!brand) {
      return next(new CustomError("Brand not found", 404));
    }
    const product = await Product.create({
      categoryId: subCate.categoryId,
      subCategoryId: brand.subCategoryId,
      brandId: req.params.id,
      name: req.body.name,
      price: req.body.price,
      quantity: req.body.quantity,
    });

    return res.status(201).json({
      status: "Success",
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
}; 

//update products (this route can perform only admin)
module.exports.updateProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { productName, productBrand, productPrice, productQuantity } =
      req.body;
    const updateProduct = await Product.findByIdAndUpdate(
      { _id: id },
      {
        productName,
        productBrand,
        productPrice,
        productQuantity,
      },
      { new: true }
    );

    if (!updateProduct) {
      next(new CustomError("Product not found", 404));
    }

    return res.status(200).json({
      status: "success",
      updateProduct,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      err: error,
    });
  }
};

//delete products (this route can perform only admin)
module.exports.deleteProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);

    if (!product) {
      next(new CustomError("Product not found", 404));
    }
    const deletedProduct = await Product.findByIdAndDelete({ _id: id });

    return res.status(200).json({
      status: "success",
      message: "delete successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fail",
      err: error,
    });
  }
};
