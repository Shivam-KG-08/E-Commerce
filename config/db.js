const mongoose = require("mongoose");
function databaseConnected() {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("Database connected successfully");
    })
    .catch((error) => {
      console.log(error);
    });
}

module.exports = databaseConnected;
