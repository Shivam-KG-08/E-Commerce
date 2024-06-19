const Cart = require("../model/cartModel");
const Product = require("../model/productModel");
const stripe = require("stripe")(process.env.SECRET_KEY);

//process payment

const processPayment = () => {
  return new Promise((resolve, reject) => {
    // let paymentStatus = true;
    let paymentStatus = Math.random() > 0.5;

    setTimeout(() => {
      if (paymentStatus) {
        resolve("Payment success");
      } else {
        reject("Payment failed");
      }
    }, 5000);
  });
};

module.exports.checkoutHandler = async (req, res) => {
  try {
    const id = req.params.cartId;
    let cart = await Cart.findById(id);
    console.log(cart);

    if (!cart) {
      return res.status(404).json({
        status: "error",
        message: "cart not found",
      });
    }

    if (cart.items.length == 0) {
      return res.status(404).json({
        status: "error",
        message: "Please add item in to cart then complete payment",
      });
    }

    let cartProduct = cart.items;

    try {
      await processPayment(); //it calls when process payment resolve means successs

      cartProduct.map(async (i) => {
        let prd = await Product.findOne({ _id: i.productId });
        if (i.isReserved == true) {
          prd.productQuantity = prd.productQuantity - i.quantity;
        } else {
          prd.productQuantity = prd.productQuantity - 0;
        }
        await prd.save();
      });

      cart.isComplete = true;

      cart.items = [];
      cart.grandTotal = 0;

      cart.status = "Completed";

      await cart.save();

      res.status(200).json({
        status: "success",
        message: "Payment successfully",
      });
    } catch (paymentError) {
      cartProduct.map(async (i) => {
        let prd = await Product.findOne({ _id: i.productId });

        //if product is reserved then not add quantity in to inventory because when first time failure happens quantity updated in to inventory at that time isReserves value is false.

        if (i.isReserved == true) {
          prd.productQuantity = prd.productQuantity + 0;
        } else {
          //if any item added later time in to cart initially value is false , at that time quantity whould be not update in to inventory so now we updated in to inventory

          prd.productQuantity = prd.productQuantity + i.quantity;
        }
        await prd.save();
        // console.log(prd);
      });

      //this code can help if any time failure happen we should identify which product is failed so change property isReserved = true

      setTimeout(() => {
        cart.items.map((i) => {
          return (i.isReserved = true);
        });

        cart.save();
      }, 6000);

      /**************************************************************************************** */
      //   let arrayOfProducts = [];

      //   //   update  quantity in inventory manage when there is an error while payment fails
      //   const allpProductId = cart.items.map((i) => {
      //     return i.productId;
      //   });
      //   const allpProductQuantity = cart.items.map((i) => {
      //     return i.quantity;
      //   });
      //   for (let i of allpProductId) {
      //     let products = await Product.findById(i);
      //     if (products) {
      //       arrayOfProducts.push(products);
      //     } else {
      //       return res.status(400).json({
      //         status: "fails",
      //         error: `Product with ID ${i} not found`,
      //       });
      //     }
      //   }
      //   //here check if status failed then not perform update quantity functionality
      //   if (cart.status != "Failed") {
      //     for (let i = 0; i < arrayOfProducts.length; i++) {
      //       arrayOfProducts[i].productQuantity =
      //         arrayOfProducts[i].productQuantity + allpProductQuantity[i];
      //       await arrayOfProducts[i].save();
      //     }
      //   }

      //redirect to home page

      //make a cart status failed
      cart.status = "Failed";
      await cart.save();
      return res.status(500).json({ status: "fails", err: paymentError });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fails", error });
  }
};

module.exports.checkoutPayment = async (req, res) => {
  const id = req.params.cartId;
  let cart = await Cart.findById(id);
  console.log(cart);

  if (!cart) {
    next(new CustomError("Cart not found", 404));
  }

  if (cart.items.length == 0) {
    return res.status(404).json({
      status: "error",
      message: "Please add item in to cart then complete payment",
    });
  }

  try {
    const cart = await Cart.findOne({ userId: req.locals._id });
    const cartItems = cart.items;

    cartItems.map(async (i) => {
      let prd = await Product.findOne({ _id: i.productId });
      prd.productQuantity = prd.productQuantity - i.quantity;
      await prd.save();
    });

    const lineItems = cartItems.map((item) => ({
      price_data: {
        currency: "INR",
        product_data: {
          name: item.productName,
        },
        unit_amount: item.productPrice * 100,
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      shipping_address_collection: {
        allowed_countries: ["IN"],
      },
      success_url: `http://localhost:8080/api/v1/payment/success/${id}`,
      cancel_url: `http://localhost:8080/api/v1/payment/cancel/${id}`,
    });

    // console.log(session);
    // res.send(session.url);
    res.status(200).json({
      status: "success",
      data: session,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};

module.exports.successPayment = async (req, res) => {
  const id = req.params.id;

  let cart = await Cart.findById(id);

  let cartProduct = cart.items;

  try {
    cart.isComplete = true;

    cart.items = [];
    cart.grandTotal = 0;

    cart.status = "Completed";

    await cart.save();

    res.json({
      status: "success",
      message: "Payment succesfull",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: "fail",
      error,
    });
  }
};
module.exports.cancelPayment = async (req, res) => {
  const id = req.params.id;

  let cart = await Cart.findById(id);

  let cartProduct = cart.items;
  try {
    setTimeout(() => {
      cartProduct.map(async (i) => {
        let prd = await Product.findOne({ _id: i.productId });

        //if product is reserved then not add quantity in to inventory because when first time failure happens quantity updated in to inventory at that time isReserves value is false.

        if (i.isReserved == true) {
          prd.productQuantity = prd.productQuantity + i.quantity;
        }
        // else {
        //if any item added later time in to cart initially value is false , at that time quantity whould be not update in to inventory so now we updated in to inventory

        //   prd.productQuantity = prd.productQuantity +;
        // }
        await prd.save();
        // console.log(prd);
      });
    }, 10000);

    //this code can help if any time failure happen we should identify which product is failed so change property isReserved = true

    setTimeout(() => {
      cart.items.map((i) => {
        return (i.isReserved = true);
      });

      cart.save();
    }, 2000);

    return res.json({
      status: "fails",
      message: "Payment fails",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: "fail",
      error,
    });
  }
};
