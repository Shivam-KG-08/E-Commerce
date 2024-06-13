const Cart = require("../model/cart");
const Product = require("../model/products");

//Add item in to cart
module.exports.addToCart = async (req, res) => {
  try {
    const id = req.user._id;
    const productId = req.params.productId;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ userId: id });

    const product = await Product.findOne({
      _id: productId,
    });

    if (!product) {
      return res.status(400).json({
        status: "fails",
        message: "Product not found",
      });
    }

    if (quantity > product.productQuantity) {
      return res.status(400).json({
        status: "fail",
        message: "Quantity of item is not available",
      });
    }

    let createCart;
    if (!cart) {
      // create a cart for user
      createCart = await Cart.create({
        userId: id,
        items: [],
        grandTotal: 0,
      });

      await createCart.save();
    }
    let findIndex = cart.items.findIndex((i) => {
      return i.productId == productId;
    });

    if (findIndex == -1) {
      console.log(cart);
      cart.items.push({
        productId,
        productName: product.productName,
        productBrand: product.productBrand,
        productPrice: product.productPrice,
        quantity,
        subTotal: quantity * product.productPrice,
      });

      product.productQuantity = product.productQuantity - quantity;
      await product.save();

      cart.calculateGrandTotal(cart);

      await cart.save();

      return res.status(201).json({
        status: "success",
        cart,
      });
    } else {
      // have an cart
      console.log(findIndex);
      let previousProductQuant = product.productQuantity;
      let previousItemQuant = cart.items[findIndex].quantity;

      cart.items[findIndex].quantity = quantity;
      cart.items[findIndex].subTotal = quantity * product.productPrice;

      product.productQuantity =
        previousProductQuant - (quantity - previousItemQuant);

      await product.save();

      cart.calculateGrandTotal(cart);

      await cart.save();
      return res.status(201).json({
        status: "success",
        cart,
      });

      // check the item is there in the cart or not
      // cart.items(item => item.id === id)
      // cart.item.quatity = quantity
      // upate the quantity
      // if not add the item to the cart
    }

    // const product = await Product.findOne({
    //   _id: productId,
    // });

    // if (quantity > product.productQuantity) {
    //   return res.status(400).json({
    //     status: "fail",
    //     message: "Quantity of item is not available",
    //   });
    // }

    // const itemExist = res.cart.items.find((i) => {
    //   return i.productId == productId;
    // });

    // // console.log(itemExist);

    // if (itemExist) {
    //   let previousProductQuant = product.productQuantity;
    //   let previousQuant = itemExist.quantity;
    //   itemExist.quantity = quantity;
    //   itemExist.subTotal = quantity * itemExist.productPrice;

    //   // console.log(previousProductQuant);
    //   // console.log(itemExist);
    //   // console.log(previousQuant);
    //   // console.log(itemExist.quantity);
    //   product.productQuantity =
    //     previousProductQuant - (itemExist.quantity - previousQuant);
    //   await product.save();

    //   let total = 0;
    //   for (let i in res.cart.items) {
    //     total += res.cart.items[i].subTotal;
    //   }
    //   res.cart.grandTotal = total;
    //   await res.cart.save();

    //   return res.json({
    //     status: "success",
    //     updatedCart: res.cart,
    //   });
    // } else {
    //   console.log("before add");
    //   cart.items.push({
    //     productId,
    //     productName: product.productName,
    //     productPrice: product.productPrice,
    //     quantity,
    //     subTotal: Number(quantity) * product.productPrice,
    //   });

    //   console.log("after add");
    //   product.productQuantity = product.productQuantity - quantity;
    //   await product.save();

    //   let total = 0;
    //   for (let i in cart.items) {
    //     total += cart.items[i].subTotal;
    //   }

    //   cart.grandTotal = total;
    //   await cart.save();
    //   console.log("After save");
    //   res.json({
    //     status: "success",
    //     cart,
    //   });
    // }
  } catch (error) {
    console.log(error);
    return res.json({
      status: "fails",
      error,
    });
  }
};

//update quantity in to cart
// module.exports.updateQuantity = async (req, res, next) => {
//   try {
//     const id = req.user._id;
//     const productId = req.params.productId;
//     const cart = await Cart.findOne({ userId: id });

//     let findItem = cart.items.find((i) => {
//       return i.productId == productId;
//     });

//     findItem.quantity = Number(req.body.quantity);
//     findItem.subTotal = findItem.productPrice * Number(req.body.quantity);

//     let total = 0;
//     for (let i in cart.items) {
//       total += cart.items[i].subTotal;
//     }
//     cart.subTotal = total;

//     cart.grandTotal = total;

//     await cart.save();
//     res.json({
//       status: "success",
//       cart,
//     });
//   } catch (error) {
//     const err = new CustomError(error.message);
//     next(err);
//   }
// };

//getcart
module.exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(400).json({
        status: "fails",
        message: "Cart not found",
      });
    }

    if (cart.items.length == 0) {
      return res.status(400).json({
        status: "fails",
        message: "Your cart is empty please add item in to cart",
      });
    }
    return res.status(200).json({
      status: "Success",
      cart,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};

//remove cart
module.exports.removeCart = async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id });
  const allpProductId = cart.items.map((i) => {
    return i.productId;
  });

  const allpProductQuantity = cart.items.map((i) => {
    return i.quantity;
  });

  // let arrayOfProducts = [];
  // for (let i = 0; i < allpProductId.length; i++) {
  //   let products = res.cart.items[i].productId;
  //   if (products) {
  //     arrayOfProducts.push(products);
  //   } else {
  //     return res.status(400).json({
  //       status: "fails",
  //       error: `Product with ID ${i} not found`,
  //     });
  //   }
  // }

  let arrayOfProducts = [];
  for (let i of allpProductId) {
    let products = await Product.findOne({ _id: i });

    if (products) {
      arrayOfProducts.push(products);
    } else {
      return res.status(400).json({
        status: "fails",
        error: `Product with ID ${i} not found`,
      });
    }
  }

  for (let i = 0; i < arrayOfProducts.length; i++) {
    arrayOfProducts[i].productQuantity =
      arrayOfProducts[i].productQuantity + allpProductQuantity[i];
    await arrayOfProducts[i].save();
  }

  cart.items = [];
  cart.grandTotal = 0;

  try {
    const updateCart = await cart.save();
    return res.status(200).json({
      status: "success",
      cart: updateCart,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};

//remove item from cart

module.exports.deleteItem = async (req, res) => {
  try {
    const productId = req.params.productId;

    const cart = await Cart.findOne({ userId: req.user._id });

    const itemIndex = cart.items.findIndex(
      (item) => item.productId == productId
    );

    console.log(itemIndex);

    if (itemIndex != -1) {
      const product = await Product.findOne({ _id: productId });
      const removeItem = cart.items.splice(itemIndex, 1);

      product.productQuantity =
        product.productQuantity + removeItem[0].quantity;

      await product.save();

      res.cart.grandTotal = cart.grandTotal - removeItem[0].subTotal;

      const updatedCartItem = await cart.save();

      return res.status(200).json({
        status: "success",
        cart: updatedCartItem,
      });
    } else {
      return res.status(400).json({
        status: "fails",
        message: "There is not any item in to cart",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};
