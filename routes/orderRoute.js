const express = require("express");
const auth = require("../middleware/auth");
const orderController = require("../controller/orderController");
const router = express.Router();

//authentication midd
router.use(auth);

router.route("/").get(orderController.getOrders);
router.route("/:orderId").patch(orderController.upadteOrderstatus);

module.exports = router;
