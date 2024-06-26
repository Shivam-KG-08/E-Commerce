const { model } = require("mongoose");
const Cart = require("../model/cart");
const User = require("../model/user");
const Product = require("../model/products");

const getCartByUser = async (req, res, next) => {
  let cart;
  try {
    // console.log(req.user);
    const id = req.user._id;

    // cart = await Cart.findOne({ userId: id }).populate({
    //   path: "items",
    //   populate: {
    //     path: "productId",
    //     model: Product,
    //   },
    // });
    cart = await Cart.findOne({ userId: id });

    // console.log(cart);
    console.log(cart);
    if (cart == null) {
      cart = new Cart({ userId: id, items: [], grandTotal: 0 });
      await cart.save();
    }
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
    next(error);
  }
  res.cart = cart;
  next();
};

module.exports = getCartByUser;
