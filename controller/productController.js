const Product = require("../model/products");

module.exports.createProduct = async (req, res) => {
  const { productName, productBrand, productPrice, productQuantity } = req.body;

  try {
    if (!productName || !productBrand || !productPrice || !productQuantity) {
      return res.status(400).json({
        status: "fails",
        message: "All fields are required!",
      });
    }

    const products = await Product.create({
      productName,
      productBrand,
      productPrice,
      productQuantity,
    });

    return res.status(200).json({
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

module.exports.getProduct = async (req, res) => {
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

module.exports.updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const { productName, productBrand, productPrice } = req.body;
    const updateProduct = await Product.findByIdAndUpdate(
      { _id: id },
      {
        productName,
        productBrand,
        productPrice,
      },
      { new: true }
    );
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

module.exports.singleProduct = async (req, res) => {
  try {
    const id = req.params.id;

    const singleProduct = await Product.findById({ _id: id });
    if (!singleProduct) {
      return res.status(400).json({
        status: "fails",
        message: "Product is not available",
      });
    }
    return res.status(200).json({
      status: "success",
      product: singleProduct,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      err: error,
    });
  }
};

module.exports.deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;
    await Product.findByIdAndDelete({ _id: id });
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
