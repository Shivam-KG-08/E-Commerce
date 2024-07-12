const express = require("express");
const router = express.Router();
const UserController = require("../controller/userController");
const auth = require("../middleware/auth");

router.route("/signup").post(UserController.signup);
router.route("/login").post(UserController.login);
router.route("/getProfile").get(auth, UserController.getProfile);

module.exports = router;
