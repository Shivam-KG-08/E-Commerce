const express = require("express");
const auth = require("../middleware/auth");
const orderController = require("../controller/orderController");
const router = express.Router();

//authentication midd
router.use(auth);

router.route("/:orderId").patch(orderController.upadteOrderstatus);
router.route("/").get(orderController.getOrders);

module.exports = router;
