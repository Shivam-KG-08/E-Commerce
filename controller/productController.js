const Product = require("../model/productModel");
const CustomError = require("../utility/CustomError");

//create product (this route can perform only admin)
module.exports.createProduct = async (req, res) => {
  const {
    productName,
    productBrand,
    productPrice,
    productQuantity,
    productCategories,
  } = req.body;

  try {
    if (
      !productCategories ||
      !productName ||
      !productBrand ||
      !productPrice ||
      !productQuantity
    ) {
      return res.status(400).json({
        status: "fails",
        message: "All fields are required!",
      });
    }

    let product = await Product.findOne({ productName });
    if (product) {
      return res.status(400).json({
        status: "fails",
        message: "Product already exist",
      });
    }
    const products = await Product.create({
      productCategories,
      productName,
      productBrand,
      productPrice,
      productQuantity,
    });
    console.log(products);

    return res.status(201).json({
      status: "success",
      products,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fail",
      err: error,
    });
  }
};

//get All products
module.exports.products = async (req, res) => {
  try {
    let queryStr = JSON.stringify(req.query);
    // const lim = Number(req.query.limit) || 2;
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // const productPrice = req.query.sort;
    let product = await Product.find(JSON.parse(queryStr));

    if (product.length == 0) {
      return res.status(404).json({
        status: "Fails",
        message: "Not any product found",
      });
    }

    return res.status(200).json({
      status: "success",
      product,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fail",
      err: error,
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

//get products
module.exports.getProduct = async (req, res, next) => {
  try {
    const id = req.params.id;

    const product = await Product.findById({ _id: id });
    if (!product) {
      next(new CustomError("Product not found", 404));
    }
    return res.status(200).json({
      status: "success",
      product,
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
