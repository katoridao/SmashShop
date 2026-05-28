/**
 * SmashShop — Auth State Manager
 * Quản lý trạng thái đăng nhập tập trung bằng localStorage.
 * Được dùng chung trên toàn bộ các trang.
 */

const SmashAuth = (() => {
  const AUTH_KEY = 'smashshop_auth';

  /* ── Đọc / ghi / xoá ── */
  function get() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
  }

  function save(auth) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    _notify();
  }

  function clear() {
    localStorage.removeItem(AUTH_KEY);
    _notify();
  }

  /* ── Helpers ── */
  function isLoggedIn() {
    return !!get()?.user?._id;
  }

  function getUser() {
    return get()?.user || null;
  }

  function isAdmin() {
    return getUser()?.role === 'admin';
  }

  /* ── Lắng nghe thay đổi (cross-tab & same-tab) ── */
  const _listeners = [];

  function onChange(fn) {
    _listeners.push(fn);
    return () => {
      const idx = _listeners.indexOf(fn);
      if (idx !== -1) _listeners.splice(idx, 1);
    };
  }

  function _notify() {
    const auth = get();
    _listeners.forEach((fn) => fn(auth));
  }

  // Đồng bộ khi tab khác thay đổi localStorage
  window.addEventListener('storage', (e) => {
    if (e.key === AUTH_KEY) _notify();
  });

  return { get, save, clear, isLoggedIn, getUser, isAdmin, onChange };
})();

// Expose globally
window.SmashAuth = SmashAuth;
