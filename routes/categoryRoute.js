const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const categoryController = require("../controller/categoryController");
const auth = require("../middleware/auth");

router.use(auth);

router
  .route("/")
  .get(categoryController.getAllCategory)
  .post(
    userController.protectedRoute("admin"),
    categoryController.createCategory
  );
router.route("/product").get(categoryController.getAllPrd);

router
  .route("/:id")
  .post(
    userController.protectedRoute("admin"),
    categoryController.createSubcategory
  )
  .get(categoryController.getCategory);

router
  .route("/brand/:id")
  .post(userController.protectedRoute("admin"), categoryController.createBrand)
  .get(categoryController.getBrand);

router
  .route("/product/:id")
  .post(userController.protectedRoute("admin"), categoryController.createPrd)
  .get(categoryController.getProducts);

module.exports = router;
