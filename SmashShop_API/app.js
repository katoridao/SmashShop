var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

const db = require("./config/database");
const apiRouter = require("./routes/api");
const User = require("./models/User");
const Product = require("./models/Product");
const Cart = require("./models/Cart");
const Order = require("./models/Order");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");

var app = express();

// app.js - thay đoạn CORS cũ bằng đoạn này
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

async function seedDefaultAdmin() {
  try {
    const adminEmail = "admin@smashshop.vn";
    const defaultPassword = "123456";

    const existingAdmin = await User.findOne({
      $or: [{ email: adminEmail }, { name: "admin" }],
    });

    if (existingAdmin) {
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    await User.create({
      name: "admin",
      email: adminEmail,
      password: hashedPassword,
      phone: "0000000000",
      role: "admin",
    });

    console.log("Đã tạo tài khoản admin mặc định");
  } catch (error) {
    console.error("Không thể tạo tài khoản admin mặc định:", error.message);
  }
}

(async function bootstrap() {
  try {
    await db.connect();
    await seedDefaultAdmin();
  } catch (error) {
    console.error("Khởi động API thất bại:", error.message);
  }
})();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api", apiRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
