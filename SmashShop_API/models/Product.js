const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên sản phẩm là bắt buộc"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Giá sản phẩm là bắt buộc"],
      min: [0, "Giá sản phẩm không được âm"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Giá trị giảm giá không được âm"],
    },
    brand: {
      type: String,
      required: [true, "Thương hiệu là bắt buộc"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Danh mục là bắt buộc"],
      trim: true,
    },
    style: {
      type: String, // Ví dụ: "Vợt tấn công", "Vợt cân bằng"
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    thumbnail: {
      type: String, // Đường dẫn ảnh đại diện sản phẩm
      required: [true, "Ảnh đại diện sản phẩm là bắt buộc"],
    },
    images: {
      type: [String], // Mảng chứa các ảnh phụ để làm Gallery slider
      default: [],
    },
    stock: {
      type: Number,
      required: [true, "Số lượng trong kho là bắt buộc"],
      min: [0, "Số lượng kho không được âm"],
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Tạo virtual field để trả về đúng cấu trúc JSON giống frontend mong đợi (nếu cần)
productSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Đảm bảo virtuals được xuất ra khi chuyển sang JSON
productSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id; // Ẩn _id đi để khớp với prod.id ở front-end nếu muốn gọn sạch
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
