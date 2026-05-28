const fs = require('fs');
const profile = fs.readFileSync('profile.html', 'utf8');

// Extract profile CSS
const styleMatch = profile.match(/<style>([\s\S]*?)<\/style>/);
const profileCss = styleMatch[1];

// Extract topbar
const topbarMatch = profile.match(/<header class="topbar">[\s\S]*?<\/header>/);
const topbarHtml = topbarMatch[0];

const files = [
  { name: 'orderhistory.html', styleMarker: '/* ==========================================\n       ORDER HISTORY PAGE', heroSelector: '<div class="oh-hero">', heroEnd: '</div>\n      </div>\n    </div>', wrapper: '<div class="oh-filter-wrap">' },
  { name: 'productmanagement.html', styleMarker: '/* ===== PRODUCT MANAGEMENT STYLES ===== */', heroSelector: '<div class="pm-header">', heroEnd: '</div>', wrapper: '<div class="pm-toolbar">' },
  { name: 'orders.html', styleMarker: '/* ===== ORDER MANAGEMENT MAIN ===== */', heroSelector: '<div class="page-heading">', heroEnd: '</div>', wrapper: '<div class="stat-cards">' },
  { name: 'revenue.html', styleMarker: '/* ==========================================\n       REVENUE PAGE STYLES', heroSelector: '<div class="rev-header">', heroEnd: '</div>', wrapper: '<div class="stat-cards">' }
];

for (const f of files) {
  let content = fs.readFileSync(f.name, 'utf8');
  
  // 1. Replace header
  content = content.replace(/<header>[\s\S]*?<\/header>/, topbarHtml);
  
  // 2. Remove footer
  content = content.replace(/<footer>[\s\S]*?<\/footer>/, '');
  
  // 3. Replace <main> with page-shell
  content = content.replace(/<main[^>]*>/, '<main class="page-shell">');
  
  // 4. Update styles
  const styleStartIdx = content.indexOf('<style>') + 7;
  const specificStyleIndex = content.indexOf(f.styleMarker);
  
  if (specificStyleIndex !== -1 && styleStartIdx !== -1) {
    const beforeStyle = content.substring(0, styleStartIdx);
    const specificStyles = content.substring(specificStyleIndex);
    content = beforeStyle + '\n' + profileCss + '\n' + specificStyles;
  }
  
  // 5. Wrap content
  // Remove container if it's the first child of main
  content = content.replace(/<main class="page-shell">\s*<div class="container">/, '<main class="page-shell">');
  
  // Make hero card
  const heroRegex = new RegExp(f.heroSelector.replace(/</g, '\\<').replace(/>/g, '\\>') + '([\\s\\S]*?)' + f.heroEnd.replace(/</g, '\\<').replace(/>/g, '\\>'));
  content = content.replace(heroRegex, '<section class="hero-card">\n<div>\n$1\n</div>\n</section>');
  
  // Wrap the rest in profile-card. 
  // We can just wrap from wrapper to before </main>
  const wrapperRegex = new RegExp('(' + f.wrapper.replace(/</g, '\\<').replace(/>/g, '\\>') + '[\\s\\S]*?)(</main>)');
  content = content.replace(wrapperRegex, '<section class="profile-card">\n$1\n</section>\n$2');
  
  fs.writeFileSync(f.name, content, 'utf8');
}

console.log('Done syncing layouts!');
