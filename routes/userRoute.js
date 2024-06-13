const express = require("express");
const router = express.Router();
const UserController = require("../controller/userController");
const auth = require("../middleware/auth");

router.route("/signup").post(UserController.signup);
router.route("/logIn").post(UserController.login);
router.route("/getProfile").get(auth, UserController.getProfile);

// router.route("/setAdmin").get(auth, UserController.setAdmin);

module.exports = router;
