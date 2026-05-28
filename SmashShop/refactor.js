const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

function findClosingTag(content, startIdx) {
  let depth = 1;
  let idx = startIdx;
  while (depth > 0 && idx < content.length) {
    const nextDivOpen = content.indexOf('<div', idx);
    const nextDivClose = content.indexOf('</div', idx);
    if (nextDivClose === -1) break; 
    
    if (nextDivOpen !== -1 && nextDivOpen < nextDivClose) {
      depth++;
      idx = nextDivOpen + 4;
    } else {
      depth--;
      idx = nextDivClose + 6; 
    }
  }
  return idx; 
}

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // 1. Replace <header>
  content = content.replace(/<header>[\s\S]*?<\/header>/g, '<div id="shared-header"></div>');

  // 2. Replace authModal
  const authModalIdx = content.indexOf('<div id="authModal"');
  if (authModalIdx !== -1) {
    let startRemove = authModalIdx;
    const commentMatch = content.slice(Math.max(0, startRemove - 150), startRemove).match(/<!--.*?AUTH MODAL.*?-->\s*$/i);
    if (commentMatch) {
      startRemove -= commentMatch[0].length;
    }

    const startTagEnd = content.indexOf('>', authModalIdx) + 1;
    const endRemove = findClosingTag(content, startTagEnd);
    content = content.slice(0, startRemove) + content.slice(endRemove);
  }

  // 3. Remove old auth.js script tags
  content = content.replace(/<script src="\/SmashShop\/public\/auth\.js"><\/script>\s*/g, '');

  // 4. Remove inline auth script block
  // We match from `const API_BASE = 'http://localhost:3000/api';` or `// ── AUTH MODULE INTEGRATION`
  // up to the `window.addEventListener('keydown'` block
  const authRegex1 = /(?:\/\/ ========= AUTH.*?=========|\/\/ ── AUTH MODULE INTEGRATION[\s\S]*?)?const API_BASE\s*=\s*['"]http:\/\/localhost:3000\/api['"];[\s\S]*?window\.addEventListener\('keydown'[\s\S]*?\}\);/g;
  content = content.replace(authRegex1, '');

  // Remove any remaining auth-related function calls in the script
  content = content.replace(/SmashAuth\.onChange\(updateAuthUI\);/g, '');
  content = content.replace(/currentAuth\s*=\s*getStoredAuth\(\);/g, '');
  content = content.replace(/updateAuthUI\(\);/g, '');

  // Also remove "// Lắng nghe thay đổi auth (đa tab) → cập nhật UI ngay lập tức"
  content = content.replace(/\/\/ Lắng nghe thay đổi auth[\s\S]*?ngay lập tức\s*/g, '');

  // 5. Inject shared scripts at the end of body
  let activePage = '';
  if (file === 'index.html') activePage = 'home';
  else if (file === 'sale.html') activePage = 'sale';
  else if (file === 'about.html') activePage = 'about';
  else if (file === 'contact.html') activePage = 'contact';
  else if (file === 'productmanagement.html') activePage = 'products';

  const sharedScripts = `
  <!-- Shared Auth & Header -->
  <script src="/SmashShop/public/auth.js"></script>
  <script src="/SmashShop/public/header.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (window.SmashHeader) {
        SmashHeader.init({ activePage: '${activePage}' });
      }
    });
  </script>
`;

  content = content.replace(/<\/body>/i, sharedScripts + '\n</body>');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Updated ' + file);
  }
});
console.log('Refactoring complete.');
