const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const replacement = `function handleUserAction(action) {
      closeUserMenu();

      const auth = currentAuth || getStoredAuth();
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
          clearAuth();
          window.location.href = '/SmashShop/index.html';
          break;
      }
    }`;

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Match any version of handleUserAction
  const regex = /function handleUserAction\(action\) \{[\s\S]*?case 'logout':[\s\S]*?\}\s*\}/;
  
  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Updated ' + file);
  }
});
