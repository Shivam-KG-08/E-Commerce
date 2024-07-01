const mongoose = require("mongoose");
function dbConnected() {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("Database connected successfully");
    })
    .catch((error) => {
      console.log(error);
    });
}

module.exports = dbConnected;
