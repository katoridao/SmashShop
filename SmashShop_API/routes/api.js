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
const {
  generateRandomPassword,
  sendPasswordResetEmail,
} = require("../utils/emailHelper");

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
// THAY ĐỔI / NÂNG CẤP LOGIC QUẢN LÝ SẢN PHẨM (PRODUCT)
// ==========================================

// Cấu hình upload đa trường: 1 ảnh thumbnail chính và tối đa 10 ảnh slider phụ (images)
const productUploadConfig = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

// 1. LẤY TẤT CẢ SẢN PHẨM
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Tìm kiếm sản phẩm
router.get("/products/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(200).json({ success: true, products: [] });
    }

    // Tìm kiếm không phân biệt chữ hoa chữ thường bằng Regex
    const products = await Product.find({
      name: { $regex: q, $options: "i" },
    })
      .select("name price thumbnail id") // Chỉ lấy các trường cần thiết cho ô tìm kiếm
      .limit(6); // Giới hạn hiển thị 6 kết quả để dropdown không bị quá dài

    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. LẤY CHI TIẾT 1 SẢN PHẨM THEO ID
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

// 4. THÊM MỚI SẢN PHẨM (Đã nâng cấp hỗ trợ mảng ảnh images)
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

    // Validate bắt buộc phải có ảnh thumbnail chính
    if (!req.files || !req.files["thumbnail"]) {
      return res.status(400).json({
        success: false,
        message: "Ảnh đại diện sản phẩm (thumbnail) là bắt buộc",
      });
    }
    const thumbnailUrl = `/uploads/${req.files["thumbnail"][0].filename}`;

    // Xử lý mảng ảnh phụ nếu có tải lên
    let imageUrls = [];
    if (req.files["images"]) {
      imageUrls = req.files["images"].map(
        (file) => `/uploads/${file.filename}`,
      );
    }

    // Xử lý specs động chuỗi JSON string sang Object Map
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

// 5. CẬP NHẬT SẢN PHẨM (PUT - Đã sửa lỗi ép kiểu số rỗng và hỗ trợ cập nhật ảnh phụ)
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

    // Cập nhật chuỗi thường
    if (name !== undefined) product.name = name;
    if (brand !== undefined) product.brand = brand;
    if (category !== undefined) product.category = category;
    if (style !== undefined) product.style = style;
    if (description !== undefined) product.description = description;
    if (video !== undefined) product.video = video;

    // Tránh lỗi ép số khi truyền chuỗi rỗng từ Form Data
    if (price !== undefined && price !== "") product.price = Number(price);
    if (discount !== undefined && discount !== "")
      product.discount = Number(discount);
    if (stock !== undefined && stock !== "") product.stock = Number(stock);

    // Cập nhật ảnh thumbnail chính nếu có upload mới
    if (req.files && req.files["thumbnail"]) {
      product.thumbnail = `/uploads/${req.files["thumbnail"][0].filename}`;
    }

    // Cập nhật mảng ảnh phụ (Thay thế hoàn toàn mảng cũ nếu có upload mảng mới)
    if (req.files && req.files["images"]) {
      product.images = req.files["images"].map(
        (file) => `/uploads/${file.filename}`,
      );
    }

    // Cập nhật specs thông số động
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

// 6. XÓA SẢN PHẨM
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

// API: Toggle (Thêm hoặc Xóa) sản phẩm khỏi danh sách yêu thích
router.post("/users/:id/favorites", async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // Bảo vệ code nếu user cũ chưa có mảng favorites
    if (!user.favorites) user.favorites = [];

    // Kiểm tra xem sản phẩm đã có trong wishlist chưa
    const index = user.favorites.indexOf(productId);

    if (index === -1) {
      user.favorites.push(productId);
      await user.save();
      return res
        .status(200)
        .json({
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

// API: Lấy danh sách sản phẩm yêu thích của User
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

    // Trả về danh sách favorites đã được populate
    res.status(200).json({ success: true, favorites: user.favorites || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
