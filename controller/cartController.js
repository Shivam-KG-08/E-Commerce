const Cart = require("../model/cartModel");
const Product = require("../model/productModel");
const CustomError = require("../utility/CustomError");

//Add item in to cart
module.exports.addToCart = async (req, res) => {
  try {
    const id = req.locals._id;
    const productId = req.params.productId;
    const { quantity } = req.body;

    if (quantity <= 0) {
      return res.status(400).json({
        status: "fails",
        message: "Please enter valid quantity",
      });
    }

    const cart = await Cart.findOne({ userId: id });

    const product = await Product.findById(productId);

    if (!product) {
      next(new CustomError("Product not found", 404));
    }

    if (quantity > product.productQuantity) {
      return res.status(400).json({
        status: "fail",
        message: "Quantity of item is not available",
      });
    }

    let createCart;
    if (!cart) {
      // if there is not any cart available then create an cart then add items in to cart
      createCart = await Cart.create({
        userId: id,
        items: [],
        grandTotal: 0,
      });

      await createCart.save();
    }

    //find products in to cart if product is not found then return -1 as a index ,  and if product is found then return index of products

    let findIndex = cart.items.findIndex((i) => {
      return i.productId == productId;
    });

    if (findIndex < 0) {
      // if (findIndex ==  -1) {

      cart.items.push({
        productId,
        productName: product.productName,
        productBrand: product.productBrand,
        productPrice: product.productPrice,
        quantity,
        subTotal: quantity * product.productPrice,
      });

      //update value in products and saved in to database

      // product.productQuantity = product.productQuantity - quantity;
      await product.save();

      //calculate grandTotal value in cart
      cart.calculateGrandTotal(cart);

      cart.status = "Processing";
      cart.isComplete = false;

      await cart.save();

      return res.status(201).json({
        status: "success",
        cart,
      });
    } else {
      // if user has found product in to cart  , then it sure to make update quantity of product in to cart

      //take previous quantity of product
      let previousProductQuantity = product.productQuantity;

      // take previous items quantity that passed in first when user add items in to cart
      let previousItemQuant = cart.items[findIndex].quantity;

      //assign updated quantity to the cart items
      cart.items[findIndex].quantity = quantity;

      // calculate upated quantity with subTotal
      cart.items[findIndex].subTotal = quantity * product.productPrice;

      // update product quantity in to Products
      // product.productQuantity =
      //   previousProductQuantity - (quantity - previousItemQuant);

      await product.save();

      cart.calculateGrandTotal(cart);
      await cart.save();

      return res.status(201).json({
        status: "success",
        cart,
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({
      status: "fails",
      error,
    });
  }
};

//getcart

module.exports.getCart = async (req, res, next) => {
  //take user from request object
  const user = req.locals;

  try {
    let cart = await Cart.findOne({ userId: user._id });

    if (!cart) {
      next(new CustomError("Cart not found", 404));
    }

    // if there is not any item in to cart then shown cart is empty

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
    res.status(400).json({
      status: "fails",
      error,
    });
  }
};

// make an empty cart

// module.exports.removeCart = async (req, res) => {
//   try {
//     const userId = req.locals._id;

//     const cart = await Cart.findOne({ userId });

//     //take all productId in to cart items in form of array

//     const allpProductId = cart.items.map((i) => {
//       return i.productId;
//     });

//     //take all productQuantity in to cart items in form of array

//     const allpProductQuantity = cart.items.map((i) => {
//       return i.quantity;
//     });

//     let arrayOfProducts = [];

//     //loop allProductId and find Porducts and store in products and then push that products in to arrayOfProducts

//     for (let i of allpProductId) {
//       let products = await Product.findById(i);

//       if (products) {
//         arrayOfProducts.push(products);
//       } else {
//         return res.status(400).json({
//           status: "fails",
//           error: `Product with ID ${i} not found`,
//         });
//       }
//     }

//     //product item is remove so quantity of item is back to Products
//     if (cart.status != "Failed") {
//       for (let i = 0; i < arrayOfProducts.length; i++) {
//         arrayOfProducts[i].productQuantity =
//           arrayOfProducts[i].productQuantity + allpProductQuantity[i];

//         //after update evenry products then save in to database
//         await arrayOfProducts[i].save();
//       }
//     }

//     //item is empty so make an emoty array with grandtotal 0.s
//     cart.items = [];
//     cart.grandTotal = 0;

//     await cart.save();

//     return res.status(200).json({
//       status: "success",
//       cart,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(400).json({
//       status: "fails",
//       error,
//     });
//   }
// };

module.exports.emptyCart = async (req, res, next) => {
  try {
    const userId = req.locals._id;
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      next(new CustomError("Cart not found", 404));
    }

    cart.items.map(async (i) => {
      let prd = await Product.findOne({ _id: i.productId });
      if (i.isReserved) {
        prd.productQuantity = prd.productQuantity + i.quantity;
      } else {
        prd.productQuantity = prd.productQuantity + 0;
      }
      prd.save();
    });

    cart.items = [];
    cart.grandTotal = 0;

    await cart.save();

    return res.status(200).json({
      status: "success",
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

//remove  particular item from cart

module.exports.deleteItem = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const userId = req.locals._id;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      next(new CustomError("Cart not found", 404));
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId == productId
    );

    // if item index is anything rather then -1 means productitem is found now simply we have to delete item

    if (itemIndex != -1) {
      const product = await Product.findById(productId);

      const removeItem = cart.items.splice(itemIndex, 1);

      //product quantity update

      // product.productQuantity =
      //   product.productQuantity + removeItem[0].quantity;
      await product.save();

      cart.grandTotal = cart.grandTotal - removeItem[0].subTotal;
      await cart.save();

      return res.status(200).json({
        status: "success",
        cart,
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

module.exports.deleteCart = async (req, res, next) => {
  try {
    const cartId = req.params.cartId;
    let cart = await Cart.findByIdAndDelete(cartId);

    if (!cart) {
      next(new CustomError("Cart not found", 404));
    }

    return res.status(200).json({
      status: "success",
      message: "Cart deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};
