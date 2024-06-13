const User = require("../model/user");
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

    let token = jwt.sign({ email }, process.env.SECRET_KEY);

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
    console.log(user);

    let check = user.comparePassword(password, user.password);

    if (!user) {
      return res.status(400).json({
        status: "fails",
        message: "Invalid userName and password!",
      });
    }

    if (user.userName !== userName && check) {
      console.log(error);
      return res.status(400).json({
        status: "fails",
        error,
      });
    } else {
      let token = jwt.sign({ userName }, process.env.SECRET_KEY);
      console.log(token);
      console.log("token");

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
    if (req.user.role != role) {
      const err = new CustomError(
        "You have not an authorized person so can't access this route",
        "400"
      );
      next(err);
    }
    next();
  };
};
