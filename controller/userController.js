const User = require("../model/userModel");
const jwt = require("jsonwebtoken");
const CustomError = require("../utility/CustomError");

module.exports.signup = async (req, res) => {
  try {
    const { userName, email, password, phoneNumber, role } = req.body;
    const userExist = await User.findOne({ email });

    if (userExist) {
      return res.status(200).json({
        status: "fail",
        message: "User Already Exist",
      });
    }

    const user = await User.create({
      userName,
      email,
      password,
      phoneNumber,
      role,
    });

    console.log(user);

    let token = jwt.sign({ id: user._id }, process.env.SECRET_KEY);

    return res.status(200).json({
      status: "success",
      user,
      token,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fail",
      error,
    });
  }
};

module.exports.login = async (req, res, next) => {
  try {
    const { userName, password } = req.body;

    if (!userName || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Username or Password is required",
      });
    }

    const user = await User.findOne({ userName });

    if (!user) {
      return res.status(400).json({
        status: "fails",
        message: "Invalid userName and password!",
      });
    }
    //return true if encrypt password and user.password is same
    let check = await user.comparePassword(password, user.password);

    if (user.userName == userName && check) {
      let token = jwt.sign({ id: user._id }, process.env.SECRET_KEY);

      return res.status(200).json({
        status: "success",
        message: "Successfully login",
        user: {
          username: user.userName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
        },
        token,
      });
    } else {
      return res.status(400).json({
        status: "fail",
        message: "Invalid username or password",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      status: "fails",
      error,
    });
  }
};

module.exports.getProfile = async (req, res) => {
  try {
    const { userName, email, phoneNumber, role } = req.user;

    return res.status(200).json({
      status: "success",
      user: {
        userName,
        email,
        phoneNumber,
        role,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: "fail",
      error,
    });
  }
};

module.exports.protectedRoute = (role) => {
  return (req, res, next) => {
    if (!role.includes(req.locals.role)) {
      next(
        new CustomError(
          "You have not an authorized person so can't access this route",
          403
        )
      );
    }

    next(); // calling next middleware
  };
};
