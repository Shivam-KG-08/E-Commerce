const express = require("express");
const router = express.Router();
const CartController = require("../controller/cartController");
const getCartById = require("../middleware/getCartByUser");
const userController = require("../controller/userController");
const auth = require("../middleware/auth");

router.use(auth);

router
  .route("/")
  .get(
    userController.protectedRoute("user"),
    getCartById,
    CartController.getCart
  )
  .delete(
    userController.protectedRoute("user"),
    getCartById,
    CartController.removeCart
  );

router
  .route("/:productId")
  .post(
    userController.protectedRoute("user"),
    getCartById,
    CartController.addToCart
  );

router
  .route("/item/:productId")
  .post(
    userController.protectedRoute("user"),
    getCartById,
    CartController.updateQuantity
  )
  .delete(
    userController.protectedRoute("user"),
    getCartById,
    CartController.deleteItem
  );

module.exports = router;
