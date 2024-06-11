class CustomError extends Error {
  constructor(message, statuscode) {
    super(message);
    this.statuscode = statuscode || 500;
    this.status = `${statuscode}`.startsWith("4") ? "fail" : "error";

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = CustomError;
