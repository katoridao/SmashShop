const fs = require('fs');

const files = ['orderhistory.html', 'productmanagement.html', 'orders.html', 'revenue.html'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Remove <nav> block
  content = content.replace(/<nav class="navbar navbar-expand-lg navbar-dark">[\s\S]*?<\/nav>/, '');

  // Remove <footer> block
  content = content.replace(/<footer>[\s\S]*?<\/footer>/, '');

  // Write back
  fs.writeFileSync(file, content, 'utf8');
}

console.log('Removed nav and footer from all 4 files.');
