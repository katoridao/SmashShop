const fs = require('fs');
const path = require('path');
const dir = __dirname;
['orders.html', 'revenue.html', 'profile.html'].forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace the inline event listener with a correct one
  const regex = /document\.querySelectorAll\('\.user-menu-action'\)\.forEach\(.*?=>\s*\{[\s\S]*?\}\);/g;
  const replacement = `document.querySelectorAll('.user-menu-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        closeUserMenu();
        const auth = currentAuth || getStoredAuth();
        const isAdmin = auth?.user?.role === 'admin';
        if (action === 'logout') {
          clearAuth();
          window.location.href = '/SmashShop/index.html';
        }
        else if (action === 'profile') window.location.href = '/SmashShop/profile.html';
        else if (action === 'history') window.location.href = '/SmashShop/orderhistory.html';
        else if (action === 'products' && isAdmin) window.location.href = '/SmashShop/productmanagement.html';
        else if (action === 'orders' && isAdmin) window.location.href = '/SmashShop/orders.html';
        else if (action === 'revenue' && isAdmin) window.location.href = '/SmashShop/revenue.html';
      });
    });`;

  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Updated ' + file);
  }
});
