require("dotenv").config();
const express = require("express");
const app = express();
const productRoute = require("./routes/productRoute");
const userRoute = require("./routes/userRoute");
const cartRoute = require("./routes/cartRoute");
const paymentRoute = require("./routes/paymentRoute");
const databaseConnected = require("./config/db");

//database connected
databaseConnected();

//built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//if we handle complex or nested data we use extended : true
// if we handle simple data then used extended : false

//Routes
app.use("/api/v1/products", productRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/carts", cartRoute);

//payment routes
app.use("/api/v1/payment", paymentRoute);

//not available route
app.all("*", (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server`);
  (err.status = "fail"), (err.statuscode = 404), next(err);
});

//global error handler
app.use((error, req, res, next) => {
  console.log(error.stack);
  return res.status(error.statuscode).json({
    status: error.status,
    message: error.message,
  });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on PORT no: ${PORT}`);
});
