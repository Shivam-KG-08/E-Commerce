require("dotenv").config();
const express = require("express");
const app = express();
const productRoute = require("./routes/productRoute");
const userRoute = require("./routes/userRoute");
const cartRoute = require("./routes/cartRoute");
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

//global error handler
app.use((err, req, res, next) => {
  console.log(err.stack);
  return res.status(err.statuscode).json({
    status: err.status,
    err,
  });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on PORT no: ${PORT}`);
});
