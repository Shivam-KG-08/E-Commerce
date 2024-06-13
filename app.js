require("dotenv").config();
const express = require("express");
const main = require("./config/db");
const app = express();
const PORT = 8000 || process.env.PORT;
const productRoute = require("./routes/productRoute");
const userRoute = require("./routes/userRoute");
const cartRoute = require("./routes/cartRoute");

main();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/product", productRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/cart", cartRoute);

//global error handler
app.use((err, req, res, next) => {
  console.log(err.stack);
  return res.status(err.statuscode).json({
    status: "fail",
    err: {
      message: err.message,
      statuscode: err.statuscode,
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT no: ${PORT}`);
});
