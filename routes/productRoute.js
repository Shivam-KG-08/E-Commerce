const express = require("express");
const productController = require("../controller/productController");
const userController = require("../controller/userController");
const auth = require("../middleware/auth");

const router = express.Router();

router.route("/").get(productController.getAllProducts);

router
  .route("/:id")
  .get(productController.getProduct)
  .post(auth,userController.protectedRoute("admin"), productController.createProduct)
  .patch(auth,userController.protectedRoute("admin"),productController.updateProduct)
  .delete(auth,userController.protectedRoute("admin"),productController.deleteProduct);

module.exports = router;
