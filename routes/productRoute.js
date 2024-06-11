const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
const userController = require("../controller/userController");

// const authAdmin = require("../middleware/authAdmin");
const auth = require("../middleware/auth");

//free route
router.route("/").get(productController.getProduct);
router.route("/:id").get(productController.singleProduct);

//auth
router.use(auth);

router
  .route("/")
  .post(
    userController.protectedRoute("admin"),
    productController.createProduct
  );

router
  .route("/:id")
  .patch(
    userController.protectedRoute("admin"),
    productController.updateProduct
  )
  .delete(
    userController.protectedRoute("admin"),
    productController.deleteProduct
  );

module.exports = router;
