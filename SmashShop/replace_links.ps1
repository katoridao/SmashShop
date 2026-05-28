$files = @("balo.html", "giay.html", "phukien.html", "tuivot.html", "vot.html")
foreach ($file in $files) {
    $content = Get-Content $file -Raw
    $content = $content -replace '<div class="category-card">\s*<img src="([^"]+)" alt="[^"]*">\s*<h3>Vợt cầu lông</h3>\s*</div>', '<a href="/SmashShop/vot.html" class="category-card">
        <img src="$1" alt="Vợt">
        <h3>Vợt cầu lông</h3>
      </a>'
    $content = $content -replace '<div class="category-card">\s*<img src="([^"]+)" alt="[^"]*">\s*<h3>Giày cầu lông</h3>\s*</div>', '<a href="/SmashShop/giay.html" class="category-card">
        <img src="$1" alt="Giày">
        <h3>Giày cầu lông</h3>
      </a>'
    $content = $content -replace '<div class="category-card">\s*<img src="([^"]+)" alt="[^"]*">\s*<h3>Balo cầu lông</h3>\s*</div>', '<a href="/SmashShop/balo.html" class="category-card">
        <img src="$1" alt="Balo">
        <h3>Balo cầu lông</h3>
      </a>'
    $content = $content -replace '<div class="category-card">\s*<img src="([^"]+)" alt="[^"]*">\s*<h3>Túi vợt cầu lông</h3>\s*</div>', '<a href="/SmashShop/tuivot.html" class="category-card">
        <img src="$1" alt="Túi">
        <h3>Túi vợt cầu lông</h3>
      </a>'
    $content = $content -replace '<div class="category-card">\s*<img src="([^"]+)" alt="[^"]*">\s*<h3>Phụ kiện cầu lông</h3>\s*</div>', '<a href="/SmashShop/phukien.html" class="category-card">
        <img src="$1" alt="Phụ kiện">
        <h3>Phụ kiện cầu lông</h3>
      </a>'
    Set-Content $file -Value $content -Encoding UTF8
}
