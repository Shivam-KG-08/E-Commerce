const Cart = require("../model/cart");
const Product = require("../model/products");
const CustomError = require("../utility/CustomError");

//Add item in to cart
module.exports.addToCart = async (req, res, next) => {
  try {
    const id = req.user._id;
    const cart = await Cart.findOne({ userId: id });

    const productId = req.params.productId;
    const { quantity } = req.body;

    const product = await Product.findOne({ _id: productId });
    const productPrice = product.productPrice;
    const productQuantity = product.productQuantity;

    if (quantity > productQuantity) {
      return res.status(400).json({
        status: "fail",
        message: "Quantity of item is not available",
      });
    }

    // const itemIndex = res.cart.items.findIndex(
    //   (item) => item.productId == productId
    // );

    const itemExist = res.cart.items.find((i) => {
      return i.productId == productId;
    });

    console.log(itemExist);

    if (itemExist) {
      let previousProductQuant = product.productQuantity;
      let previousQuant = itemExist.quantity;
      itemExist.quantity = quantity;
      itemExist.subTotal = quantity * itemExist.productPrice;

      console.log(previousProductQuant);
      console.log(itemExist);
      console.log(previousQuant);
      console.log(itemExist.quantity);
      product.productQuantity =
        previousProductQuant - (itemExist.quantity - previousQuant);
      await product.save();

      let total = 0;
      for (let i in res.cart.items) {
        total += res.cart.items[i].subTotal;
      }
      res.cart.subTotal = total;

      res.cart.grandTotal = total;
      await res.cart.save();
      res.json({
        status: "success",
        updatedCart: res.cart,
      });
    } else {
      cart.items.push({
        productId,
        productName: product.productName,
        productPrice,
        quantity,
        subTotal: Number(quantity) * productPrice,
      });

      product.productQuantity = product.productQuantity - quantity;
      await product.save();

      let total = 0;
      for (let i in cart.items) {
        total += cart.items[i].subTotal;
      }
      cart.subTotal = total;

      cart.grandTotal = total;
      await cart.save();
      res.json({
        status: "success",
        cart,
      });
    }

    // if (itemIndex != -1) {
    //   const err = new CustomError("CartItem already exist in cart", "400");
    //   next(err);
    // } else {
    // const product = await Product.findOne({ _id: productId });
    // const productPrice = product.productPrice;
    // const productQuantity = product.productQuantity;

    // if (quantity > productQuantity) {
    //   return res.status(400).json({
    //     status: "fail",
    //     message: "Quantity of item is not available",
    //   });
    // }
    // cart.items.push({
    //   productId,
    //   productName: product.productName,
    //   productPrice,
    //   quantity,
    //   subTotal: Number(quantity) * productPrice,
    // });

    // product.productQuantity = product.productQuantity - quantity;
    // await product.save();

    // let total = 0;
    // for (let i in cart.items) {
    //   total += cart.items[i].subTotal;
    // }
    // cart.subTotal = total;

    // cart.grandTotal = total;
    // await cart.save();
    // res.json({
    //   status: "success",
    //   cart,
    // });
    // }
  } catch (error) {
    console.log(error);
    const err = new CustomError(error.message);
    next(err);
  }
};

//update quantity in to cart
module.exports.updateQuantity = async (req, res, next) => {
  try {
    const id = req.user._id;
    const productId = req.params.productId;
    const cart = await Cart.findOne({ userId: id });

    let findItem = cart.items.find((i) => {
      return i.productId == productId;
    });

    findItem.quantity = Number(req.body.quantity);
    findItem.subTotal = findItem.productPrice * Number(req.body.quantity);

    let total = 0;
    for (let i in cart.items) {
      total += cart.items[i].subTotal;
    }
    cart.subTotal = total;

    cart.grandTotal = total;

    await cart.save();
    res.json({
      status: "success",
      cart,
    });
  } catch (error) {
    const err = new CustomError(error.message);
    next(err);
  }
};

//getcart
module.exports.getCart = async (req, res, next) => {
  try {
    let cart = res.cart;
    console.log(cart);

    if (cart.items.length == 0) {
      return res.send("Your cart is empty please add item in to cart");
    }
    return res.json(res.cart);
  } catch (error) {
    const err = new CustomError(error.message);
    next(err);
  }
};

//remove cart
module.exports.removeCart = async (req, res) => {
  res.cart.items = [];
  res.cart.grandTotal = 0;

  try {
    const updateCart = await res.cart.save();
    return res.status(200).json({
      status: "success",
      cart: updateCart,
    });
  } catch (error) {
    const err = new CustomError(error.message);
    next(err);
  }
};

//remove item from cart

module.exports.deleteItem = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const itemIndex = res.cart.items.findIndex(
      (item) => item.productId == productId
    );
    console.log(itemIndex);

    if (itemIndex == -1) {
      const err = new CustomError("There is not any item in to cart", 400);
      next(err);
    } else {
      const product = await Product.findOne({ _id: productId });

      console.log(res.cart.items);
      const removeItem = res.cart.items.splice(itemIndex, 1);
      console.log(removeItem);

      product.productQuantity =
        product.productQuantity + removeItem[0].quantity;

      await product.save();

      res.cart.grandTotal = res.cart.grandTotal - removeItem[0].subTotal;

      const updatedCartItem = await res.cart.save();
      return res.status(200).json({
        status: "success",
        cart: updatedCartItem,
      });
    }
  } catch (error) {
    // const err = new CustomError(error.message);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};
