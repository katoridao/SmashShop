/**
 * SmashShop — Auth State Synchronizer for Category B pages
 * Automatically injects the user profile avatar and dropdown,
 * handles login redirects, and synchronizes auth state across tabs.
 */
document.addEventListener('DOMContentLoaded', () => {
  const headerIcons = document.querySelector('.header-icons');
  if (!headerIcons) return;

  const AUTH_KEY = 'smashshop_auth';

  function getAuth() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
  }

  // Check if we are on a Category B page (it lacks the .header-user-area wrapper)
  if (!document.querySelector('.header-user-area')) {
    // 1. Wrap header-icons inside a new header-user-area container
    const userArea = document.createElement('div');
    userArea.className = 'header-user-area';
    
    headerIcons.parentNode.insertBefore(userArea, headerIcons);
    userArea.appendChild(headerIcons);

    // 2. Remove the old static login button from inside header-icons
    const oldLoginBtn = headerIcons.querySelector('.login-btn');
    if (oldLoginBtn) {
      oldLoginBtn.remove();
    }

    // 3. Create the standard login-btn, userAvatarBtn, and userMenu dropdown
    const loginBtn = document.createElement('button');
    loginBtn.id = 'loginBtn';
    loginBtn.className = 'login-btn';
    loginBtn.type = 'button';
    loginBtn.textContent = 'Login';
    userArea.appendChild(loginBtn);

    const avatarBtn = document.createElement('button');
    avatarBtn.id = 'userAvatarBtn';
    avatarBtn.className = 'user-avatar-btn';
    avatarBtn.type = 'button';
    avatarBtn.style.display = 'none';
    avatarBtn.innerHTML = '<img id="userAvatarImg" src="public/img/user_loginned.png" alt="User logged in">';
    userArea.appendChild(avatarBtn);

    const dropdown = document.createElement('div');
    dropdown.id = 'userMenu';
    dropdown.className = 'user-menu-dropdown';
    dropdown.setAttribute('aria-hidden', 'true');
    dropdown.innerHTML = `
      <div class="user-menu-header">
        <div>
          <p class="user-menu-title">Xin chào</p>
          <h3 id="userMenuName">Khách</h3>
        </div>
        <span id="userMenuRole" class="user-menu-role">Guest</span>
      </div>
      <div class="user-menu-actions">
        <button class="user-menu-action" type="button" data-action="profile">Thông tin cá nhân</button>
        <button class="user-menu-action" type="button" data-action="history">Lịch sử đặt hàng</button>
        <button class="user-menu-action admin-only" type="button" data-action="products">Quản lý sản phẩm</button>
        <button class="user-menu-action admin-only" type="button" data-action="orders">Quản lý đơn hàng</button>
        <button class="user-menu-action admin-only" type="button" data-action="revenue">Thống kê doanh thu</button>
        <button class="user-menu-action logout" type="button" data-action="logout">Đăng xuất</button>
      </div>
    `;
    userArea.appendChild(dropdown);

    // 4. Inject matching CSS styles dynamically
    const style = document.createElement('style');
    style.textContent = `
      .header-user-area {
        position: relative;
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .user-avatar-btn {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 1px solid #2A2A2A;
        background: #222;
        padding: 0;
        overflow: hidden;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .user-avatar-btn img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .user-menu-dropdown {
        position: absolute;
        top: calc(100% + 12px);
        right: 0;
        width: min(320px, calc(100vw - 32px));
        border: 1px solid #2A2A2A;
        border-radius: 18px;
        background: #111827;
        box-shadow: 0 16px 32px rgba(0,0,0,0.35);
        padding: 16px;
        display: none;
        z-index: 1000;
      }
      .user-menu-dropdown.show {
        display: block;
      }
      .user-menu-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }
      .user-menu-title {
        color: #cbd5e1;
        font-size: 13px;
        margin-bottom: 4px;
      }
      .user-menu-header h3 {
        font-size: 18px;
        margin: 0;
        color: #fff;
      }
      .user-menu-role {
        border-radius: 999px;
        background: #2563EB;
        color: #fff;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 700;
      }
      .user-menu-actions {
        display: grid;
        gap: 10px;
      }
      .user-menu-action {
        width: 100%;
        text-align: left;
        border: none;
        border-radius: 12px;
        padding: 12px 14px;
        background: #1F2937;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
        transition: .2s ease;
      }
      .user-menu-action:hover {
        background: #2563EB;
      }
      .user-menu-action.admin-only {
        display: none;
      }
      .user-menu-action.admin-only.show {
        display: block;
      }
      .user-menu-action.logout {
        background: #7F1D1D;
      }
      .user-menu-action.logout:hover {
        background: #b91c1c;
      }
    `;
    document.head.appendChild(style);

    // 5. Event listener bindings
    loginBtn.addEventListener('click', () => {
      sessionStorage.setItem('auth_redirect', window.location.href);
      window.location.href = '/SmashShop/index.html?openAuth=login';
    });

    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header-user-area')) {
        dropdown.classList.remove('show');
      }
    });

    dropdown.querySelectorAll('.user-menu-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        dropdown.classList.remove('show');
        const auth = getAuth();
        const isAdmin = auth?.user?.role === 'admin';

        switch (action) {
          case 'profile':
            window.location.href = '/SmashShop/profile.html';
            break;
          case 'history':
            window.location.href = '/SmashShop/orderhistory.html';
            break;
          case 'products':
            if (isAdmin) window.location.href = '/SmashShop/productmanagement.html';
            break;
          case 'orders':
            if (isAdmin) window.location.href = '/SmashShop/orders.html';
            break;
          case 'revenue':
            if (isAdmin) window.location.href = '/SmashShop/revenue.html';
            break;
          case 'logout':
            localStorage.removeItem(AUTH_KEY);
            updateUI();
            window.location.href = '/SmashShop/index.html';
            break;
        }
      });
    });
  }

  // 6. Common UI rendering function
  function updateUI() {
    const auth = getAuth();
    const loginBtn = document.getElementById('loginBtn');
    const avatarBtn = document.getElementById('userAvatarBtn');
    const dropdown = document.getElementById('userMenu');
    const userMenuName = document.getElementById('userMenuName');
    const userMenuRole = document.getElementById('userMenuRole');

    if (auth && auth.user) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (avatarBtn) avatarBtn.style.display = 'flex';
      if (userMenuName) userMenuName.textContent = auth.user.name || 'Người dùng';
      if (userMenuRole) userMenuRole.textContent = auth.user.role === 'admin' ? 'Admin' : 'Guest';
      
      document.querySelectorAll('.admin-only').forEach((item) => {
        item.classList.toggle('show', auth.user.role === 'admin');
      });
    } else {
      if (loginBtn) loginBtn.style.display = 'inline-block';
      if (avatarBtn) avatarBtn.style.display = 'none';
      if (dropdown) dropdown.classList.remove('show');
      if (userMenuName) userMenuName.textContent = 'Khách';
      if (userMenuRole) userMenuRole.textContent = 'Guest';

      document.querySelectorAll('.admin-only').forEach((item) => {
        item.classList.remove('show');
      });
    }
  }

  // 7. Cross-tab storage change synchronization
  window.addEventListener('storage', (e) => {
    if (e.key === AUTH_KEY) {
      updateUI();
    }
  });

  // Initial render
  updateUI();
});
