const express = require("express");
const router = express.Router();
const UserController = require("../controller/userController");
const auth = require("../middleware/auth");

router.route("/signUp").post(UserController.signUp);
router.route("/logIn").post(UserController.login);

// router.route("/setAdmin").get(auth, UserController.setAdmin);

module.exports = router;
