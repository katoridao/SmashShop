const fs = require('fs');
const files = ['balo.html', 'giay.html', 'phukien.html', 'tuivot.html', 'vot.html'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    /<div class="category-card">\s*<img src="([^"]+)" alt="([^"]*)">\s*<h3>Vợt cầu lông<\/h3>\s*<\/div>/g,
    '<a href="/SmashShop/vot.html" class="category-card">\n        <img src="$1" alt="$2">\n        <h3>Vợt cầu lông</h3>\n      </a>'
  );
  content = content.replace(
    /<div class="category-card">\s*<img src="([^"]+)" alt="([^"]*)">\s*<h3>Giày cầu lông<\/h3>\s*<\/div>/g,
    '<a href="/SmashShop/giay.html" class="category-card">\n        <img src="$1" alt="$2">\n        <h3>Giày cầu lông</h3>\n      </a>'
  );
  content = content.replace(
    /<div class="category-card">\s*<img src="([^"]+)" alt="([^"]*)">\s*<h3>Balo cầu lông<\/h3>\s*<\/div>/g,
    '<a href="/SmashShop/balo.html" class="category-card">\n        <img src="$1" alt="$2">\n        <h3>Balo cầu lông</h3>\n      </a>'
  );
  content = content.replace(
    /<div class="category-card">\s*<img src="([^"]+)" alt="([^"]*)">\s*<h3>Túi vợt cầu lông<\/h3>\s*<\/div>/g,
    '<a href="/SmashShop/tuivot.html" class="category-card">\n        <img src="$1" alt="$2">\n        <h3>Túi vợt cầu lông</h3>\n      </a>'
  );
  content = content.replace(
    /<div class="category-card">\s*<img src="([^"]+)" alt="([^"]*)">\s*<h3>Phụ kiện cầu lông<\/h3>\s*<\/div>/g,
    '<a href="/SmashShop/phukien.html" class="category-card">\n        <img src="$1" alt="$2">\n        <h3>Phụ kiện cầu lông</h3>\n      </a>'
  );

  fs.writeFileSync(file, content, 'utf8');
}
console.log("Done");
