const Order = require("../model/orderModel");
const CustomError = require("../utility/CustomError");

module.exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.locals._id });
    if (!orders) {
      next(new CustomError("User has not done any orders till", 404));
    }
    return res.status(200).json({
      status: "success",
      orders,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};

module.exports.upadteOrderstatus = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);

    if (!order) {
      next(new CustomError("Order not found", 404));
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      { _id: orderId },
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      status: "success",
      Order: updatedOrder,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fails",
      error,
    });
  }
};
