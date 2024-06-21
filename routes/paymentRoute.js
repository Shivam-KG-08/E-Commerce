const express = require("express");
const paymentController = require("../controller/paymentController");
const userController = require("../controller/userController");
const auth = require("../middleware/auth");

const router = express.Router();

router.route("/success/:id").get(paymentController.successPayment);

router.route("/cancel/:id").get(paymentController.cancelPayment);

//authentication route
router.use(auth);

router
  .route("/checkout")
  .post(
    userController.protectedRoute("user"),
    paymentController.checkoutPayment
  );

router.route(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.webHook
);

module.exports = router;
