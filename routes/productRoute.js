const express = require("express");
const productController = require("../controller/productController");
const userController = require("../controller/userController");
const auth = require("../middleware/auth");

const router = express.Router();

//free route
router.route("/").get(productController.products);
router.route("/:id").get(productController.getProduct);

//authentication route
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
