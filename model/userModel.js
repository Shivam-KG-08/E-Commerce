const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const UserSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: "Email is invalid",
      },
    },
    password: {
      type: String,
      minlength: 8,
      required: [true, "Please Enter your password"],
    },
    phoneNumber: {
      type: Number,
      required: true,
      unique: [true, "PhoneNumber is required"],
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { versionKey: false }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    console.log(error);
  }
});

UserSchema.methods.comparePassword = async (password, hashedPassword) => {
  let check = await bcrypt.compare(password, hashedPassword);
  return check;
};

const User = mongoose.model("user", UserSchema);
module.exports = User;
