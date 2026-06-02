# Product Card Component

Component chuẩn để hiển thị danh sách sản phẩm trên toàn web.

## 📋 Nội dung Component

- **CSS**: Toàn bộ styling cho product cards (responsive grid, hover effects, etc.)
- **JavaScript**: Hàm `renderProducts()` để render danh sách sản phẩm
- **Utilities**: Các hàm tiện ích (format giá, sanitize tên, etc.)

## 🚀 Cách Sử Dụng

### Step 1: Load Component

Thêm đoạn code này vào `<head>` hoặc trước phần script chính của bạn:

```javascript
<script>
  async function loadProductCardComponent() {
    try {
      const response = await fetch('/SmashShop/components/productCard.html');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      let html = await response.text();
      
      // Extract and inject <style> tags
      const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
      let styleMatch;
      while ((styleMatch = styleRegex.exec(html)) !== null) {
        const styleEl = document.createElement('style');
        styleEl.textContent = styleMatch[1];
        document.head.appendChild(styleEl);
      }
      
      // Extract and execute <script> tags
      const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
      let scriptMatch;
      while ((scriptMatch = scriptRegex.exec(html)) !== null) {
        const script = document.createElement('script');
        script.textContent = scriptMatch[1];
        document.body.appendChild(script);
      }
      
      console.log('✅ Product Card component loaded');
    } catch (error) {
      console.error('❌ Lỗi tải Product Card component:', error);
    }
  }
  
  loadProductCardComponent();
</script>
```

### Step 2: Tạo Container

Thêm một container HTML nơi bạn muốn hiển thị sản phẩm:

```html
<div class="products" id="yourContainerId"></div>
```

### Step 3: Gọi renderProducts()

```javascript
// Cách 1: Render tất cả sản phẩm
window.productCardComponent.renderProducts('yourContainerId', products);

// Cách 2: Render với lọc (filter)
window.productCardComponent.renderProducts('yourContainerId', products, {
  showDiscount: true,
  filterFn: (p) => parseFloat(p.discount || 0) > 0  // Chỉ hiển thị sản phẩm có discount
});

// Cách 3: Tùy chỉnh hành động "Mua ngay"
window.productCardComponent.renderProducts('yourContainerId', products, {
  showDiscount: true,
  onAddToCart: (productId, productName) => {
    console.log(`Added: ${productName}`);
    // Thêm logic của bạn ở đây
  }
});
```

## 📝 Ví Dụ Thực Tế

### Ví dụ 1: Trang VOT (hiển thị tất cả vợt)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Vợt Cầu Lông</title>
  <!-- ... other head content ... -->
</head>
<body>
  <div id="header-container"></div>
  
  <main class="container">
    <h1>Danh Sách Vợt</h1>
    <div class="products" id="votProducts"></div>
  </main>

  <script>
    // Load component
    async function loadProductCardComponent() {
      // ... (copy từ Step 1 ở trên)
    }
    loadProductCardComponent();
    
    // Load header
    async function loadHeaderComponent() {
      // ... (existing header loading code)
    }
    loadHeaderComponent();
    
    // Load products
    async function loadVotProducts() {
      try {
        const response = await fetch('http://localhost:3000/api/products');
        const data = await response.json();
        
        let products = Array.isArray(data) ? data : (data.data || data.products || data.result || []);
        
        // Render all products
        window.productCardComponent.renderProducts('votProducts', products);
      } catch (err) {
        console.error('Lỗi:', err);
      }
    }
    
    document.addEventListener('DOMContentLoaded', loadVotProducts);
  </script>
</body>
</html>
```

### Ví dụ 2: Trang SALE (hiển thị chỉ sản phẩm giảm giá)

```javascript
// Chỉ render sản phẩm có discount > 0
window.productCardComponent.renderProducts('saleProducts', products, {
  showDiscount: true,
  filterFn: (p) => parseFloat(p.discount || 0) > 0
});
```

### Ví dụ 3: Trang GIÀY (hiển thị và xử lý giỏ hàng)

```javascript
window.productCardComponent.renderProducts('shoeProducts', products, {
  showDiscount: true,
  onAddToCart: (productId, productName) => {
    // Gọi API thêm vào giỏ hàng
    fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: productId })
    }).then(res => res.json())
      .then(data => {
        alert(`✅ Đã thêm "${productName}" vào giỏ hàng!`);
      })
      .catch(err => console.error('Lỗi:', err));
  }
});
```

## 🎨 Tùy Chỉnh Styling

Tất cả CSS được load tự động từ component. Nếu muốn override, thêm CSS custom sau khi load component:

```html
<style>
  .product-card {
    border-radius: 25px;  /* Thay đổi bo góc */
  }
  
  .price {
    color: #ff6b00;  /* Thay đổi màu giá */
  }
</style>
```

## 📦 Available Options

```javascript
window.productCardComponent.renderProducts(containerId, products, {
  showDiscount: true,        // Hiển thị / ẩn badge giảm giá
  filterFn: null,            // Hàm lọc sản phẩm (optional)
  onAddToCart: null          // Callback khi click "Mua ngay" (optional)
})
```

## 🔧 API Response Structure

Component tự động phát hiện các cấu trúc API khác nhau:

```javascript
// Cấu trúc 1: Array trực tiếp
[{ name: 'Product 1', price: 100000, ... }, ...]

// Cấu trúc 2: Object với data property
{ data: [{ name: 'Product 1', ... }, ...] }

// Cấu trúc 3: Object với products property
{ products: [{ name: 'Product 1', ... }, ...] }

// Cấu trúc 4: Object với result property
{ result: [{ name: 'Product 1', ... }, ...] }
```

## ✅ Yêu Cầu Sản Phẩm Tối Thiểu

Mỗi object sản phẩm cần có ít nhất các trường này:

```javascript
{
  _id: "product_id",           // hoặc id
  name: "Product Name",
  price: 100000,
  thumbnail: "/path/to/img.jpg",
  discount: 20                 // percentage (0-100)
}
```

## 💡 Utility Functions

Ngoài `renderProducts()`, component cung cấp các hàm tiện ích:

```javascript
// Format giá tiền
window.productCardComponent.formatPrice(100000)  // "100.000đ"

// Lấy full URL ảnh
window.productCardComponent.getFullImageUrl(thumbnail)

// Sanitize HTML trong tên sản phẩm
window.productCardComponent.sanitizeName("<script>alert('xss')</script>")
```

## 📱 Responsive Design

Component tự động responsive:
- **Mobile**: 1 cột
- **Tablet**: 2 cột
- **Desktop**: 3 cột
