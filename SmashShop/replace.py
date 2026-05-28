import re
import os

files = ['balo.html', 'giay.html', 'phukien.html', 'tuivot.html', 'vot.html']
for filename in files:
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    content = re.sub(
        r'<div class="category-card">\s*<img src="([^"]+)" alt="([^"]*)">\s*<h3>Vợt cầu lông</h3>\s*</div>',
        r'<a href="/SmashShop/vot.html" class="category-card">\n        <img src="\1" alt="\2">\n        <h3>Vợt cầu lông</h3>\n      </a>',
        content
    )
    content = re.sub(
        r'<div class="category-card">\s*<img src="([^"]+)" alt="([^"]*)">\s*<h3>Giày cầu lông</h3>\s*</div>',
        r'<a href="/SmashShop/giay.html" class="category-card">\n        <img src="\1" alt="\2">\n        <h3>Giày cầu lông</h3>\n      </a>',
        content
    )
    content = re.sub(
        r'<div class="category-card">\s*<img src="([^"]+)" alt="([^"]*)">\s*<h3>Balo cầu lông</h3>\s*</div>',
        r'<a href="/SmashShop/balo.html" class="category-card">\n        <img src="\1" alt="\2">\n        <h3>Balo cầu lông</h3>\n      </a>',
        content
    )
    content = re.sub(
        r'<div class="category-card">\s*<img src="([^"]+)" alt="([^"]*)">\s*<h3>Túi vợt cầu lông</h3>\s*</div>',
        r'<a href="/SmashShop/tuivot.html" class="category-card">\n        <img src="\1" alt="\2">\n        <h3>Túi vợt cầu lông</h3>\n      </a>',
        content
    )
    content = re.sub(
        r'<div class="category-card">\s*<img src="([^"]+)" alt="([^"]*)">\s*<h3>Phụ kiện cầu lông</h3>\s*</div>',
        r'<a href="/SmashShop/phukien.html" class="category-card">\n        <img src="\1" alt="\2">\n        <h3>Phụ kiện cầu lông</h3>\n      </a>',
        content
    )

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done")
