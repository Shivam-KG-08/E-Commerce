const express = require("express");
const paymentController = require("../controller/paymentController");
const userController = require("../controller/userController");
const auth = require("../middleware/auth");

const router = express.Router();

router.route("/success/:id").get(paymentController.successPayment);

router.route("/cancel/:id").get(paymentController.cancelPayment);

router
  .route("/webhook")
  .post(express.raw({ type: "application/json" }), paymentController.webHook);

//authentication route
router.use(auth);

router
  .route("/checkout")
  .post(
    userController.protectedRoute("user"),
    paymentController.checkoutHandler
  );

module.exports = router;
