const express = require("express");
const router = express.Router();
const CartController = require("../controller/cartController");
const userController = require("../controller/userController");
const auth = require("../middleware/auth");

//authentication router
router.use(auth);

router
  .route("/")
  .get(userController.protectedRoute("user"), CartController.getCart)
  .delete(userController.protectedRoute("user"), CartController.removeCart);

router
  .route("/item/:productId")
  .post(userController.protectedRoute("user"), CartController.addToCart)
  .delete(userController.protectedRoute("user"), CartController.deleteItem);

router
  .route("/item/checkout/:cartId")
  .get(userController.protectedRoute("user"), CartController.checkoutHandler);

module.exports = router;
