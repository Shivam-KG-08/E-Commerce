const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const categoryController = require("../controller/categoryController");
const auth = require("../middleware/auth");

router.use(auth);

router.route("/").get(categoryController.getAllCategory).post(userController.protectedRoute("admin"),categoryController.createCategory);

router.route("/:id").get(categoryController.getCategory).post(userController.protectedRoute("admin"),categoryController.createSubcategory);

router.route("/brand/:id").get(categoryController.getBrand).post(userController.protectedRoute("admin"), categoryController.createBrand);

module.exports = router;
