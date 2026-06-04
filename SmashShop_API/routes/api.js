const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");

const User = require("../models/User");
const Product = require("../models/Product");
const Review = require("../models/Review");
const Order = require("../models/Order");
const Cart = require("../models/Cart"); // Bổ sung import model Cart ở đây

const {
  generateRandomPassword,
  sendPasswordResetEmail,
} = require("../utils/emailHelper");
const { sendEmail } = require("../config/email");

const router = express.Router();

// ==========================================
// CẤU HÌNH MULTER UPLOAD (Dùng chung cho toàn bộ Router)
// ==========================================
const uploadDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Chỉ chấp nhận file hình ảnh!"));
  },
});

// Endpoint upload ảnh thời gian thực (Dành cho các trường hợp upload lẻ)
router.post("/products/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy file tệp tin tải lên.",
      });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
      success: true,
      message: "Tải hình ảnh lên thành công",
      url: imageUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper functions cho User
const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// ==============================
// LOGIC USER (GIỮ NGUYÊN)
// ==============================

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
    });
    res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ thông tin đăng nhập" });
    }
    let user;
    if (identifier === "admin" && password === "123456") {
      user = await User.findOne({ name: "admin" });
      if (!user) {
        return res
          .status(400)
          .json({ message: "Tài khoản admin không tồn tại" });
      }
    } else {
      const query = isValidEmail(identifier)
        ? { email: identifier.toLowerCase() }
        : { phone: identifier };
      user = await User.findOne(query);
      if (!user) {
        return res
          .status(400)
          .json({ message: "Email hoặc số điện thoại không tồn tại" });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Sai mật khẩu" });
      }
    }
    const token = jwt.sign({ id: user._id, role: user.role }, "SECRET_KEY", {
      expiresIn: "7d",
    });
    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Vui lòng nhập email" });
    if (!isValidEmail(email))
      return res.status(400).json({ message: "Email không hợp lệ" });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res
        .status(404)
        .json({ message: "Email không tồn tại trong hệ thống" });

    const newPassword = generateRandomPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    await sendPasswordResetEmail(email, user.name, newPassword);
    res.status(200).json({
      success: true,
      message:
        "Mật khẩu mới đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại sau.",
    });
  }
});

router.get("/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    res.status(200).json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/profile/:id", async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const phone =
      typeof req.body.phone === "string" ? req.body.phone.trim() : "";
    if (!name || !phone) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ họ tên và số điện thoại" });
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone },
      { new: true, runValidators: true },
    ).select("-password");
    if (!updatedUser)
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công",
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/change-password/:id", async (req, res) => {
  try {
    const currentPassword =
      typeof req.body.currentPassword === "string"
        ? req.body.currentPassword
        : "";
    const newPassword =
      typeof req.body.newPassword === "string" ? req.body.newPassword : "";
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới" });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.status(200).json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// LOGIC QUẢN LÝ SẢN PHẨM (PRODUCT)
// ==========================================

const productUploadConfig = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/products/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(200).json({ success: true, products: [] });
    }
    const products = await Product.find({
      name: { $regex: q, $options: "i" },
    })
      .select("name price thumbnail id")
      .limit(6);
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm" });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/products", productUploadConfig, async (req, res) => {
  try {
    const {
      name,
      price,
      discount,
      brand,
      category,
      style,
      description,
      stock,
      specs,
      video,
    } = req.body;

    if (!req.files || !req.files["thumbnail"]) {
      return res.status(400).json({
        success: false,
        message: "Ảnh đại diện sản phẩm (thumbnail) là bắt buộc",
      });
    }
    const thumbnailUrl = `/uploads/${req.files["thumbnail"][0].filename}`;

    let imageUrls = [];
    if (req.files["images"]) {
      imageUrls = req.files["images"].map(
        (file) => `/uploads/${file.filename}`,
      );
    }

    let parsedSpecs = {};
    if (specs) {
      try {
        parsedSpecs = typeof specs === "string" ? JSON.parse(specs) : specs;
      } catch (e) {
        parsedSpecs = {};
      }
    }

    const newProduct = new Product({
      name,
      price: Number(price || 0),
      discount: Number(discount || 0),
      brand,
      category,
      style,
      description,
      stock: Number(stock || 0),
      thumbnail: thumbnailUrl,
      images: imageUrls,
      specs: parsedSpecs,
      video: video || "",
    });

    await newProduct.save();
    res.status(201).json({
      success: true,
      message: "Thêm sản phẩm thành công",
      product: newProduct,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/products/:id", productUploadConfig, async (req, res) => {
  try {
    const {
      name,
      price,
      discount,
      brand,
      category,
      style,
      description,
      stock,
      specs,
      video,
    } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    if (name !== undefined) product.name = name;
    if (brand !== undefined) product.brand = brand;
    if (category !== undefined) product.category = category;
    if (style !== undefined) product.style = style;
    if (description !== undefined) product.description = description;
    if (video !== undefined) product.video = video;

    if (price !== undefined && price !== "") product.price = Number(price);
    if (discount !== undefined && discount !== "")
      product.discount = Number(discount);
    if (stock !== undefined && stock !== "") product.stock = Number(stock);

    if (req.files && req.files["thumbnail"]) {
      product.thumbnail = `/uploads/${req.files["thumbnail"][0].filename}`;
    }

    if (req.files && req.files["images"]) {
      product.images = req.files["images"].map(
        (file) => `/uploads/${file.filename}`,
      );
    }

    if (specs !== undefined) {
      try {
        product.specs = typeof specs === "string" ? JSON.parse(specs) : specs;
      } catch (e) {
        // Bỏ qua lỗi parse
      }
    }

    await product.save();
    res.status(200).json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm" });
    }
    res.status(200).json({ success: true, message: "Xóa sản phẩm thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// THỐNG KÊ ADMIN (ADMIN STATS)
// ==========================================
router.get("/admin/stats", async (req, res) => {
  try {
    const [totalOrders, orders, newUsers, lowStockProducts] = await Promise.all(
      [
        Order.countDocuments(),
        Order.find({}),
        User.countDocuments({ role: "user" }),
        Product.countDocuments({ stock: { $lte: 5 } }),
      ],
    );

    const totalRevenue = orders.reduce(
      (sum, order) => sum + (order.totalPrice || 0),
      0,
    );

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        newUsers,
        lowStockProducts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("products.productId", "name thumbnail images")
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    const enrichedOrders = orders.map((order) => ({
      ...order.toObject(),
      products: order.products.map((item) => ({
        ...item.toObject(),
        name:
          item.name || item.productId?.name || item.product?.name || "Sản phẩm",
        img:
          item.img ||
          item.productId?.thumbnail ||
          (item.productId?.images && item.productId.images[0]) ||
          item.product?.thumbnail ||
          "",
      })),
    }));

    res.status(200).json({ success: true, orders: enrichedOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// ĐÁNH GIÁ (REVIEW)
// ==========================================
router.post("/reviews", async (req, res) => {
  try {
    const { userId, productId, rating, comment } = req.body;
    if (!userId || !productId || !rating || !comment) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }

    const review = await Review.create({ userId, productId, rating, comment });
    await review.populate("userId", "name");

    res
      .status(201)
      .json({ success: true, message: "Đánh giá thành công", review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/reviews/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    let averageRating = 0;
    if (totalReviews > 0) {
      const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
      averageRating = (sum / totalReviews).toFixed(1);
    }

    res.status(200).json({
      success: true,
      reviews,
      totalReviews,
      averageRating,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// SẢN PHẨM YÊU THÍCH (WISHLIST)
// ==========================================
router.post("/users/:id/favorites", async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    if (!user.favorites) user.favorites = [];

    const index = user.favorites.indexOf(productId);

    if (index === -1) {
      user.favorites.push(productId);
      await user.save();
      return res.status(200).json({
        success: true,
        message: "Đã thêm vào yêu thích",
        isFavorite: true,
      });
    } else {
      user.favorites.splice(index, 1);
      await user.save();
      return res
        .status(200)
        .json({ success: true, message: "Đã bỏ yêu thích", isFavorite: false });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/users/:id/favorites", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID người dùng không hợp lệ" });
    }

    const user = await User.findById(req.params.id).populate("favorites");
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    res.status(200).json({ success: true, favorites: user.favorites || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// BỔ SUNG: LOGIC QUẢN LÝ GIỎ HÀNG (CART LOGIC)
// Dành riêng cho đồng bộ với Cart.js & cart.html
// ==========================================

// 1. GET: Lấy giỏ hàng của user và nạp thông tin sản phẩm (populate)
router.get("/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    let cart = await Cart.findOne({ userId }).populate("items.productId");

    // Nếu chưa từng có giỏ hàng, trả về object có mảng items rỗng để frontend không lỗi render
    if (!cart) {
      return res.status(200).json({ success: true, cart: { items: [] } });
    }
    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. PUT: Thêm sản phẩm mới hoặc cập nhật số lượng của sản phẩm trong giỏ
router.put("/cart/:userId/update", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu dữ liệu cập nhật!" });
    }

    // Lấy thông tin giá bán mới nhất và tồn kho từ Product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại trong hệ thống",
      });
    }

    // KIỂM TRA TỒN KHO GẤT QUAN TRỌNG
    if (Number(quantity) > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Chỉ còn ${product.stock} sản phẩm trong kho.`,
      });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Nếu quantity <= 0, tự động xóa sản phẩm khỏi giỏ hàng
    if (Number(quantity) <= 0) {
      cart.items = cart.items.filter(
        (item) => item.productId.toString() !== productId,
      );
      await cart.save();
      return res
        .status(200)
        .json({ success: true, message: "Đã xóa sản phẩm khỏi giỏ", cart });
    }

    const finalPrice =
      product.price - (product.price * (product.discount || 0)) / 100;
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = Number(quantity);
      cart.items[itemIndex].price = finalPrice;
    } else {
      cart.items.push({
        productId,
        quantity: Number(quantity),
        price: finalPrice,
      });
    }

    await cart.save();
    res
      .status(200)
      .json({ success: true, message: "Cập nhật giỏ hàng thành công!", cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// 3. DELETE: Xóa hoàn toàn một sản phẩm ra khỏi giỏ hàng của user
router.delete("/cart/:userId/remove", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;

    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu productId để xóa!" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giỏ hàng của người dùng này",
      });
    }

    // Lọc loại bỏ productId cần xóa khỏi mảng items
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId,
    );

    await cart.save();
    res.status(200).json({
      success: true,
      message: "Đã xóa sản phẩm khỏi giỏ hàng thành công!",
      cart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================
// ORDER CHECKOUT
// ==============================
router.post("/orders", async (req, res) => {
  try {
    const {
      userId,
      products,
      totalPrice,
      receiverName,
      phone,
      address,
      email,
      paymentMethod,
      shippingMethod,
      shippingCost,
      discount = 0,
      couponCode = "",
      note = "",
    } = req.body;

    if (
      !userId ||
      !Array.isArray(products) ||
      products.length === 0 ||
      !receiverName ||
      !phone ||
      !address ||
      !email ||
      !paymentMethod ||
      !shippingMethod ||
      shippingCost === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin đơn hàng. Vui lòng kiểm tra lại.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại.",
      });
    }

    const allowedMethods = ["COD", "BANKING", "MOMO", "CARD", "VNPAY"];
    const allowedShipping = ["standard", "express", "same_day"];
    if (
      !allowedMethods.includes(paymentMethod) ||
      !allowedShipping.includes(shippingMethod)
    ) {
      return res.status(400).json({
        success: false,
        message: "Phương thức thanh toán hoặc vận chuyển không hợp lệ.",
      });
    }

    const calculatedSubtotal = products.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      return sum + quantity * price;
    }, 0);

    const calculatedTotal =
      calculatedSubtotal + Number(shippingCost) - Number(discount || 0);
    if (calculatedTotal < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Tổng đơn hàng không hợp lệ." });
    }

    // Validate stock and enrich products with server-side names
    const enrichedProducts = [];
    for (const it of products) {
      const quantity = Number(it.quantity) || 0;
      const price = Number(it.price) || 0;
      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Số lượng sản phẩm không hợp lệ.",
        });
      }

      const existingProduct = await Product.findById(it.productId).select(
        "name stock",
      );
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: `Sản phẩm với ID ${it.productId} không tồn tại.`,
        });
      }
      if (existingProduct.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${existingProduct.name}" chỉ còn ${existingProduct.stock} sản phẩm trong kho.`,
        });
      }

      enrichedProducts.push({
        productId: it.productId,
        name: existingProduct.name,
        img:
          existingProduct.thumbnail ||
          (existingProduct.images && existingProduct.images[0]) ||
          "",
        quantity,
        price,
      });
    }

    // Decrement stock atomically per ordered product
    await Promise.all(
      enrichedProducts.map((item) =>
        Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity },
        }),
      ),
    );

    const order = await Order.create({
      userId,
      products: enrichedProducts,
      totalPrice: calculatedTotal,
      receiverName,
      phone,
      address,
      email,
      paymentMethod,
      shippingMethod,
      shippingCost,
      discount: Number(discount || 0),
      couponCode: couponCode.trim(),
      note: note.trim(),
    });

    await Cart.findOneAndUpdate({ userId }, { items: [] });

    // Send order confirmation email (non-blocking but awaited inside async IIFE)
    (async () => {
      try {
        const subject = `SmashShop - Xác nhận đơn hàng ${order._id}`;
        const itemsHtml = enrichedProducts
          .map(
            (it) => `
            <tr>
              <td style="padding:8px;border:1px solid #eee">${it.name}</td>
              <td style="padding:8px;border:1px solid #eee;text-align:center">${it.quantity}</td>
              <td style="padding:8px;border:1px solid #eee;text-align:right">${Number(it.price).toLocaleString("vi-VN")}đ</td>
              <td style="padding:8px;border:1px solid #eee;text-align:right">${(it.quantity * it.price).toLocaleString("vi-VN")}đ</td>
            </tr>`,
          )
          .join("");

        const html = `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:760px;margin:0 auto;padding:20px;">
            <h2 style="color:#1D4ED8">SmashShop - Xác nhận đơn hàng</h2>
            <p>Xin chào, <strong>${receiverName}</strong></p>
            <p>Chúng tôi đã nhận được đơn hàng <strong>#${order._id}</strong>. Chi tiết đơn hàng như sau:</p>
            <table style="width:100%;border-collapse:collapse;margin-top:12px;margin-bottom:12px;border:1px solid #eee">
              <thead>
                <tr>
                  <th style="padding:8px;border:1px solid #eee;text-align:left">Sản phẩm</th>
                  <th style="padding:8px;border:1px solid #eee">Số lượng</th>
                  <th style="padding:8px;border:1px solid #eee">Đơn giá</th>
                  <th style="padding:8px;border:1px solid #eee">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div style="text-align:right;font-size:16px;margin-top:8px">Tạm tính: <strong>${calculatedSubtotal.toLocaleString("vi-VN")}đ</strong></div>
            <div style="text-align:right;font-size:16px">Phí vận chuyển: <strong>${Number(shippingCost).toLocaleString("vi-VN")}đ</strong></div>
            <div style="text-align:right;font-size:18px;margin-top:6px">Tổng cộng: <strong style="color:#ec4899">${calculatedTotal.toLocaleString("vi-VN")}đ</strong></div>
            <hr style="margin:18px 0" />
            <h4>Thông tin người nhận</h4>
            <p>Tên: ${receiverName}<br/>SĐT: ${phone}<br/>Địa chỉ: ${address}<br/>Email: ${email}</p>
            <p style="color:#666;font-size:13px">Cảm ơn bạn đã mua hàng tại SmashShop.</p>
          </div>
        `;

        await sendEmail(email, subject, html);
        console.log("Order confirmation email sent to", email);
      } catch (err) {
        console.error(
          "Failed to send order email:",
          err && err.message ? err.message : err,
        );
      }
    })();

    res.status(201).json({
      success: true,
      message: "Đơn hàng đã được tạo thành công.",
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/orders/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId })
      .populate("products.productId", "name thumbnail images")
      .sort({ createdAt: -1 });

    const enrichedOrders = orders.map((order) => ({
      ...order.toObject(),
      products: order.products.map((item) => ({
        ...item.toObject(),
        name:
          item.name || item.productId?.name || item.product?.name || "Sản phẩm",
        img:
          item.img ||
          item.productId?.thumbnail ||
          (item.productId?.images && item.productId.images[0]) ||
          item.product?.thumbnail ||
          "",
      })),
    }));

    res.status(200).json({ success: true, orders: enrichedOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/orders/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId, status } = req.body;

    if (!userId || !status) {
      return res.status(400).json({
        success: false,
        message: "Thiếu userId hoặc status.",
      });
    }

    // Validate status is one of the allowed values
    const validStatuses = [
      "pending",
      "confirmed",
      "shipping",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Trạng thái không hợp lệ. Các trạng thái được phép: pending, confirmed, shipping, delivered, cancelled.",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng.",
      });
    }

    // Convert MongoDB ObjectId to string for comparison
    const orderUserId = order.userId.toString
      ? order.userId.toString()
      : order.userId;
    if (orderUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thay đổi trạng thái đơn hàng này.",
      });
    }

    // Handle status transitions
    if (status === "cancelled") {
      // Can only cancel from pending or confirmed status
      if (["shipping", "delivered", "cancelled"].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message:
            "Đơn hàng đã vào quá trình giao hoặc đã hoàn thành, không thể hủy.",
        });
      }
      // Restock products when cancelling
      await Promise.all(
        order.products.map((item) => {
          if (!item.productId || !item.quantity) return null;
          return Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: Number(item.quantity) },
          });
        }),
      );
      order.status = "cancelled";
    } else if (status === "confirmed") {
      // Can only confirm from pending
      if (order.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Chỉ có thể xác nhận từ trạng thái chờ xác nhận.",
        });
      }
      order.status = "confirmed";
    } else if (status === "shipping") {
      // Can only ship from confirmed
      if (order.status !== "confirmed") {
        return res.status(400).json({
          success: false,
          message: "Chỉ có thể giao từ trạng thái đã xác nhận.",
        });
      }
      order.status = "shipping";
    } else if (status === "delivered") {
      // Can only deliver from shipping
      if (order.status !== "shipping") {
        return res.status(400).json({
          success: false,
          message:
            "Chỉ có thể cập nhật thành đã nhận khi đơn hàng đang ở trạng thái đang giao.",
        });
      }
      order.status = "delivered";
    }
    // pending status cannot be set (it's initial state)

    order.updatedAt = new Date();
    await order.save();

    // Return populated order with user and products info
    const populatedOrder = await Order.findById(orderId)
      .populate("userId", "name email phone role")
      .populate("products.productId", "name price");

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công.",
      order: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
