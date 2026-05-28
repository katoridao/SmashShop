/**
 * SmashShop — Shared Header Component
 * Inject header HTML + quản lý auth UI + điều hướng menu user.
 *
 * Cách dùng:
 *   1. Thêm <div id="shared-header"></div> vào đầu <body>.
 *   2. Load auth.js trước, rồi load header.js.
 *   3. Gọi SmashHeader.init({ activePage: 'home' | 'products' | 'sale' | 'about' | 'contact' }).
 *
 * activePage values: 'home', 'products', 'sale', 'about', 'contact'
 */

const SmashHeader = (() => {
  const API_BASE = 'http://localhost:3000/api';

  /* ── Navigation map ── */
  const USER_ACTIONS = {
    profile:  '/SmashShop/profile.html',
    history:  '/SmashShop/orderhistory.html',
    products: '/SmashShop/productmanagement.html',
    orders:   '/SmashShop/orders.html',
    revenue:  '/SmashShop/revenue.html',
  };

  /* ── Build HTML ── */
  function _buildHTML(activePage) {
    const nav = [
      { id: 'home',     label: 'Trang chủ',  href: '/SmashShop/index.html' },
      { id: 'sale',     label: 'Khuyến mãi', href: '/SmashShop/sale.html' },
      { id: 'about',    label: 'Giới thiệu', href: '/SmashShop/about.html' },
      { id: 'contact',  label: 'Liên hệ',    href: '/SmashShop/contact.html' },
    ];

    const navItems = nav.map(({ id, label, href }) => `
      <li class="nav-item">
        <a class="nav-link${activePage === id ? ' active' : ''}" href="${href}">${label}</a>
      </li>
    `).join('');

    return `
<header>
  <div class="container top-header">
    <div class="logo">
      <a href="/SmashShop/index.html">SmashShop</a>
    </div>

    <div class="search-box">
      <input type="text" id="sh-search" placeholder="Tìm kiếm sản phẩm..." autocomplete="off">
      <i class="fa-solid fa-magnifying-glass"></i>
    </div>

    <div class="header-user-area">
      <div class="header-icons">
        <a href="/SmashShop/wishlist.html" title="Yêu thích"><i class="fa-regular fa-heart"></i></a>
        <a href="/SmashShop/cart.html" title="Giỏ hàng"><i class="fa-solid fa-cart-shopping"></i></a>
      </div>

      <button id="sh-loginBtn" class="login-btn" type="button">Đăng nhập</button>

      <button id="sh-avatarBtn" class="user-avatar-btn" type="button" aria-label="Tài khoản" style="display:none;">
        <img id="sh-avatarImg" src="/SmashShop/public/img/user_loginned.png" alt="Avatar">
      </button>

      <div id="sh-userMenu" class="user-menu-dropdown" aria-hidden="true">
        <div class="user-menu-header">
          <div>
            <p class="user-menu-title">Xin chào</p>
            <h3 id="sh-userName">Khách</h3>
          </div>
          <span id="sh-userRole" class="user-menu-role">Guest</span>
        </div>
        <div class="user-menu-actions">
          <button class="user-menu-action" type="button" data-action="profile">
            <i class="fa-solid fa-user" style="margin-right:8px;"></i>Thông tin cá nhân
          </button>
          <button class="user-menu-action" type="button" data-action="history">
            <i class="fa-solid fa-clock-rotate-left" style="margin-right:8px;"></i>Lịch sử đặt hàng
          </button>
          <button class="user-menu-action admin-only" type="button" data-action="products">
            <i class="fa-solid fa-boxes-stacked" style="margin-right:8px;"></i>Quản lý sản phẩm
          </button>
          <button class="user-menu-action admin-only" type="button" data-action="orders">
            <i class="fa-solid fa-receipt" style="margin-right:8px;"></i>Quản lý đơn hàng
          </button>
          <button class="user-menu-action admin-only" type="button" data-action="revenue">
            <i class="fa-solid fa-chart-line" style="margin-right:8px;"></i>Thống kê doanh thu
          </button>
          <button class="user-menu-action logout" type="button" data-action="logout">
            <i class="fa-solid fa-right-from-bracket" style="margin-right:8px;"></i>Đăng xuất
          </button>
        </div>
      </div>
    </div>
  </div>

  <nav class="navbar navbar-expand-lg navbar-dark">
    <div class="container">
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#sh-mainMenu">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="sh-mainMenu">
        <ul class="navbar-nav gap-lg-4 main-navbar">
          ${navItems}
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle${activePage === 'products' ? ' active' : ''}"
               href="#" id="sh-productsDropdown" role="button"
               data-bs-toggle="dropdown" aria-expanded="false">
              Sản phẩm
            </a>
            <ul class="dropdown-menu dropdown-menu-dark" aria-labelledby="sh-productsDropdown">
              <li><a class="dropdown-item" href="/SmashShop/vot.html">Vợt cầu lông</a></li>
              <li><a class="dropdown-item" href="/SmashShop/giay.html">Giày cầu lông</a></li>
              <li><a class="dropdown-item" href="/SmashShop/balo.html">Balo cầu lông</a></li>
              <li><a class="dropdown-item" href="/SmashShop/tuivot.html">Túi vợt cầu lông</a></li>
              <li><a class="dropdown-item" href="/SmashShop/phukien.html">Phụ kiện cầu lông</a></li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</header>

<!-- Auth Modal -->
<div id="sh-authModal" class="auth-modal-overlay" aria-hidden="true">
  <div class="auth-modal-card">
    <div class="auth-tabs">
      <button id="sh-loginTabBtn" class="auth-tab active" type="button" data-tab="login">Đăng nhập</button>
      <button id="sh-registerTabBtn" class="auth-tab" type="button" data-tab="register">Đăng ký</button>
      <button id="sh-forgotTabBtn" class="auth-tab" type="button" data-tab="forgot">Quên mật khẩu</button>
    </div>

    <form id="sh-loginForm" class="auth-form active">
      <div class="auth-field">
        <label for="sh-loginIdentifier">Email, số điện thoại</label>
        <input id="sh-loginIdentifier" name="identifier" type="text"
               placeholder="email@example.com hoặc 0123456789" required>
      </div>
      <div class="auth-field">
        <label for="sh-loginPassword">Mật khẩu</label>
        <input id="sh-loginPassword" name="password" type="password" placeholder="Nhập mật khẩu" required>
      </div>
      <div class="auth-actions">
        <button type="button" class="auth-secondary-btn" data-close-auth>Đóng</button>
        <button type="submit" class="auth-submit-btn">Đăng nhập</button>
      </div>
    </form>

    <form id="sh-registerForm" class="auth-form">
      <div class="auth-field">
        <label for="sh-registerName">Họ và tên</label>
        <input id="sh-registerName" name="name" type="text" placeholder="Nguyễn Văn A" required>
      </div>
      <div class="auth-field">
        <label for="sh-registerEmail">Email</label>
        <input id="sh-registerEmail" name="email" type="email" placeholder="name@example.com" required>
      </div>
      <div class="auth-field">
        <label for="sh-registerPhone">Số điện thoại</label>
        <input id="sh-registerPhone" name="phone" type="tel" placeholder="0123456789" required>
      </div>
      <div class="auth-field">
        <label for="sh-registerPassword">Mật khẩu</label>
        <input id="sh-registerPassword" name="password" type="password" placeholder="Tối thiểu 6 ký tự" required>
      </div>
      <div class="auth-field">
        <label for="sh-registerConfirmPassword">Xác nhận mật khẩu</label>
        <input id="sh-registerConfirmPassword" name="confirmPassword" type="password"
               placeholder="Nhập lại mật khẩu" required>
      </div>
      <div class="auth-actions">
        <button type="button" class="auth-secondary-btn" data-close-auth>Đóng</button>
        <button type="submit" class="auth-submit-btn">Đăng ký</button>
      </div>
    </form>

    <form id="sh-forgotForm" class="auth-form">
      <div class="auth-field">
        <label for="sh-forgotEmail">Email</label>
        <input id="sh-forgotEmail" name="email" type="email" placeholder="Nhập email đã đăng ký" required>
      </div>
      <p style="font-size:13px;color:#cbd5e1;margin-bottom:14px;line-height:1.5;">
        Nhập email đã đăng ký, chúng tôi sẽ gửi mật khẩu mới tới email của bạn.
      </p>
      <div class="auth-actions">
        <button type="button" class="auth-secondary-btn" data-close-auth>Đóng</button>
        <button type="submit" class="auth-submit-btn">Gửi mật khẩu mới</button>
      </div>
    </form>

    <div id="sh-authStatus" class="auth-status"></div>
  </div>
</div>
    `;
  }

  /* ── UI update ── */
  function _updateUI() {
    const user = SmashAuth.getUser();
    const loginBtn  = document.getElementById('sh-loginBtn');
    const avatarBtn = document.getElementById('sh-avatarBtn');
    const userName  = document.getElementById('sh-userName');
    const userRole  = document.getElementById('sh-userRole');
    const userMenu  = document.getElementById('sh-userMenu');

    if (!loginBtn) return;

    if (user) {
      loginBtn.style.display  = 'none';
      avatarBtn.style.display = 'flex';
      userName.textContent = user.name || 'Người dùng';
      userRole.textContent = user.role === 'admin' ? 'Admin' : 'Thành viên';
      document.querySelectorAll('.admin-only').forEach((el) =>
        el.classList.toggle('show', user.role === 'admin')
      );
    } else {
      loginBtn.style.display  = 'inline-block';
      avatarBtn.style.display = 'none';
      if (userMenu) userMenu.classList.remove('show');
      userName.textContent = 'Khách';
      userRole.textContent = 'Guest';
      document.querySelectorAll('.admin-only').forEach((el) =>
        el.classList.remove('show')
      );
    }
  }

  /* ── Auth Modal helpers ── */
  function _setStatus(msg, type = 'success') {
    const el = document.getElementById('sh-authStatus');
    if (!el) return;
    el.textContent = msg;
    el.className = `auth-status ${type}`;
  }

  function _clearStatus() {
    const el = document.getElementById('sh-authStatus');
    if (!el) return;
    el.textContent = '';
    el.className = 'auth-status';
  }

  function openAuthModal(tab = 'login') {
    const modal = document.getElementById('sh-authModal');
    if (!modal) return;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    _clearStatus();

    ['login', 'register', 'forgot'].forEach((t) => {
      document.getElementById(`sh-${t}TabBtn`).classList.toggle('active', t === tab);
      document.getElementById(`sh-${t}Form`).classList.toggle('active', t === tab);
    });
  }

  function closeAuthModal() {
    const modal = document.getElementById('sh-authModal');
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    _clearStatus();
    ['sh-loginForm', 'sh-registerForm', 'sh-forgotForm'].forEach((id) => {
      const form = document.getElementById(id);
      if (form) form.reset();
    });
  }

  /* ── User menu ── */
  function _toggleUserMenu() {
    const menu = document.getElementById('sh-userMenu');
    if (!menu) return;
    menu.classList.toggle('show');
    menu.setAttribute('aria-hidden', String(!menu.classList.contains('show')));
  }

  function _closeUserMenu() {
    const menu = document.getElementById('sh-userMenu');
    if (!menu) return;
    menu.classList.remove('show');
    menu.setAttribute('aria-hidden', 'true');
  }

  /* ── API ── */
  async function _apiRequest(endpoint, method, body) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Có lỗi xảy ra');
    return data;
  }

  /* ── Form handlers ── */
  async function _handleLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('sh-loginIdentifier').value.trim();
    const password   = document.getElementById('sh-loginPassword').value;
    try {
      const data = await _apiRequest('/login', 'POST', { identifier, password });
      SmashAuth.save(data);
      _setStatus('✓ Đăng nhập thành công!', 'success');
      setTimeout(closeAuthModal, 700);
    } catch (err) {
      _setStatus(err.message, 'error');
    }
  }

  async function _handleRegister(e) {
    e.preventDefault();
    const name            = document.getElementById('sh-registerName').value.trim();
    const email           = document.getElementById('sh-registerEmail').value.trim();
    const phone           = document.getElementById('sh-registerPhone').value.trim();
    const password        = document.getElementById('sh-registerPassword').value;
    const confirmPassword = document.getElementById('sh-registerConfirmPassword').value;

    if (password !== confirmPassword) {
      _setStatus('Mật khẩu xác nhận không khớp', 'error');
      return;
    }
    try {
      await _apiRequest('/register', 'POST', { name, email, phone, password });
      _setStatus('✓ Đăng ký thành công! Chuyển sang đăng nhập...', 'success');
      setTimeout(() => openAuthModal('login'), 1500);
    } catch (err) {
      _setStatus(err.message, 'error');
    }
  }

  async function _handleForgot(e) {
    e.preventDefault();
    const email = document.getElementById('sh-forgotEmail').value.trim();
    try {
      await _apiRequest('/forgot-password', 'POST', { email });
      _setStatus('✓ Email đã được gửi! Vui lòng kiểm tra hộp thư.', 'success');
      setTimeout(() => openAuthModal('login'), 2000);
    } catch (err) {
      _setStatus(err.message, 'error');
    }
  }

  /* ── Menu action handler ── */
  function _handleUserAction(action) {
    _closeUserMenu();
    if (action === 'logout') {
      SmashAuth.clear();
      window.location.href = '/SmashShop/index.html';
      return;
    }
    const isAdmin = SmashAuth.isAdmin();
    const adminActions = ['products', 'orders', 'revenue'];
    if (adminActions.includes(action) && !isAdmin) return;

    const target = USER_ACTIONS[action];
    if (target) window.location.href = target;
  }

  /* ── Bind events ── */
  function _bindEvents() {
    // Login button
    document.getElementById('sh-loginBtn')?.addEventListener('click', () => openAuthModal('login'));

    // Avatar → menu
    document.getElementById('sh-avatarBtn')?.addEventListener('click', _toggleUserMenu);

    // Close modal buttons
    document.querySelectorAll('[data-close-auth]').forEach((btn) =>
      btn.addEventListener('click', closeAuthModal)
    );

    // Tab buttons
    ['login', 'register', 'forgot'].forEach((tab) => {
      document.getElementById(`sh-${tab}TabBtn`)?.addEventListener('click', () => openAuthModal(tab));
    });

    // Form submits
    document.getElementById('sh-loginForm')?.addEventListener('submit', _handleLogin);
    document.getElementById('sh-registerForm')?.addEventListener('submit', _handleRegister);
    document.getElementById('sh-forgotForm')?.addEventListener('submit', _handleForgot);

    // Click outside modal → close modal
    document.getElementById('sh-authModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'sh-authModal') closeAuthModal();
    });

    // Click outside user-area → close user menu
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header-user-area')) _closeUserMenu();
    });

    // User menu actions
    document.querySelectorAll('.user-menu-action').forEach((btn) =>
      btn.addEventListener('click', () => _handleUserAction(btn.dataset.action))
    );

    // Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { _closeUserMenu(); closeAuthModal(); }
    });
  }

  /* ── Public init ── */
  function init({ activePage = 'home' } = {}) {
    const container = document.getElementById('shared-header');
    if (!container) {
      console.warn('[SmashHeader] No #shared-header element found.');
      return;
    }

    container.innerHTML = _buildHTML(activePage);
    _updateUI();
    _bindEvents();

    // Keep UI in sync when auth changes (same tab or cross-tab)
    SmashAuth.onChange(_updateUI);
  }

  return { init, openAuthModal, closeAuthModal };
})();

window.SmashHeader = SmashHeader;
