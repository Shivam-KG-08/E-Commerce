const jwt = require("jsonwebtoken");
const User = require("../model/user");
const CustomError = require("../utility/CustomError");

const auth = async (req, res, next) => {
  try {
    const token = req?.headers["authorization"]?.split(" ")[1];

    const userEmail = jwt.verify(token, process.env.SECRET_KEY);

    const user = await User.findOne({ username: userEmail.username });
    req.user = user;

    if (!user) {
      const err = new CustomError(
        "The user belogingin to this token does no longger exits!",
        "401"
      );
      next(err);
    }
    next();
  } catch (error) {
    const err = new CustomError(error);
    next(err);
  }
};

module.exports = auth;
