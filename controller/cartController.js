const Cart = require("../model/cartModel");
const Product = require("../model/productModel");
const CustomError = require("../utility/CustomError");

//Add item in to cart and update item quantity in to cart (if there is not any item available then create cart and after that add in to cart)

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
      return next(new CustomError("Product not found", 404));
    }

    if (quantity > product.productQuantity) {
      return res.status(400).json({
        status: "fail",
        message: "Quantity of item is not available",
      });
    }

    let createCart = cart;
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

    let findIndex = createCart.items.findIndex((i) => {
      return i.productId.toString() === productId;
    });

    if (findIndex < 0) {
      // if (findIndex ==  -1) {
      // console.log(findIndex);
      createCart.items.push({
        productId,
        productName: product.productName,
        productBrand: product.productBrand,
        productPrice: product.productPrice,
        quantity,
        subTotal: Number(quantity) * Number(product.productPrice),
      });

      //update value in products and saved in to database

      // product.productQuantity = product.productQuantity - quantity;
      await product.save();

      //calculate grandTotal value in cart
      createCart.calculateGrandTotal(createCart);

      createCart.status = "Processing";

      await createCart.save();

      return res.status(201).json({
        status: "success",
        cart: createCart,
      });
    } else {
      //assign updated quantity to the cart items
      createCart.items[findIndex].quantity = quantity;

      // calculate upated quantity with subTotal
      createCart.items[findIndex].subTotal = quantity * product.productPrice;

      createCart.calculateGrandTotal(cart);
      await createCart.save();

      return res.status(201).json({
        status: "success",
        cart: createCart,
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

//get details of cart
module.exports.getCart = async (req, res, next) => {
  //take user from request object
  const user = req.locals;

  try {
    let cart = await Cart.findOne({ userId: user._id });

    if (!cart) {
      return next(
        new CustomError(
          "There is nothing in your cart. Let's add some items",
          404
        )
      );
    }

    // if there is not any item in to cart then shown cart is empty

    if (cart.items.length == 0) {
      return res.status(404).json({
        status: "fails",
        message: "There is nothing in your cart. Let's add some items",
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

// make an empty cart
module.exports.emptyCart = async (req, res, next) => {
  try {
    const userId = req.locals._id;
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      next(new CustomError("Cart not found", 404));
    }

    cart.items.map(async (i) => {
      let prd = await Product.findOne({ _id: i.productId });
      console.log(i);
      // if (i.isReserved) {
      // prd.productQuantity = prd.productQuantity + i.quantity;
      // } else {
      prd.productQuantity = prd.productQuantity + 0;
      // }
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

//complete cart drop
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
