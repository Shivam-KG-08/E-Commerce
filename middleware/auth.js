const jwt = require("jsonwebtoken");
const User = require("../model/userModel");
const CustomError = require("../utility/CustomError");

const auth = async (req, res, next) => {
  try {
    const token = req?.headers["authorization"]?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    //only findById takes id as a string rather than findOne , find, etc takes as a object
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      const err = new CustomError(
        "The user belogingin to this token does no longger exits!",
        "401"
      );

      next(err);
    }

    req.locals = currentUser;
    console.log(req.locals);
    next();
  } catch (error) {
    console.log(error);
    res.status(400).json({
      status: "fails",
      error,
    });
  }
};

module.exports = auth;
