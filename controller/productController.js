const Product = require("../model/productModel");
const CustomError = require("../utility/CustomError");

//create product (this route can perform only admin)
module.exports.createProduct = async (req, res) => {
  const { productName, productBrand, productPrice, productQuantity } = req.body;

  try {
    if (!productName || !productBrand || !productPrice || !productQuantity) {
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
      productName,
      productBrand,
      productPrice,
      productQuantity,
    });

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
    const product = await Product.find({});
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
