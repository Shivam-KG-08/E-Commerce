const User = require("../model/user");
const jwt = require("jsonwebtoken");
const CustomError = require("../utility/CustomError");

module.exports.signUp = async (req, res, next) => {
  try {
    const { username, email, password, phone_number, role } = req.body;
    const userExist = await User.findOne({ email });
    console.log(req.body);

    if (userExist != undefined) {
      return res.status(200).json({
        status: "fail",
        message: "User Already Exist",
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      phone_number,
      role,
    });

    let token = jwt.sign({ email }, process.env.SECRET_KEY);
    console.log(token);

    return res.status(200).json({
      status: "success",
      user,
      token,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      error,
    });
  }
};

module.exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Username or Password is required",
      });
    }

    const user = await User.findOne({ username });
    console.log(user);

    let check = user.comparePassword(password, user.password);

    if (!user) {
      return res.status(400).json({
        status: "fails",
        message: "Invalid userName and password!",
      });
    }

    if (user.username !== username && check) {
      console.log(error);
      return res.status(400).json({
        status: "fails",
        error,
      });
    } else {
      let token = jwt.sign({ username }, process.env.SECRET_KEY);
      console.log(token);
      console.log("token");

      return res.status(200).json({
        status: "success",
        message: "Successfully login",
        user: {
          username: user.username,
          email: user.email,
          phone_number: user.phone_number,
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
    const { username, email, phone_number, role } = req.user;

    return res.status(200).json({
      status: "success",
      user: {
        username,
        email,
        phone_number,
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
