const fs = require('fs');

try {
  const profile = fs.readFileSync('profile.html', 'utf8');
  const styleMatch = profile.match(/<style>([\s\S]*?)<\/style>/);
  const profileCss = styleMatch[1];
  
  const topbarMatch = profile.match(/<header class="topbar">[\s\S]*?<\/header>/);
  const topbarHtml = topbarMatch[0];
  
  const files = [
    { name: 'productmanagement.html', styleMarker: /PRODUCT MANAGEMENT STYLES/, heroSelector: /<div class="pm-header">([\s\S]*?)<\/div>/, wrapperSelector: /(<div class="pm-toolbar">[\s\S]*?)(<\/main>)/ },
    { name: 'orders.html', styleMarker: /ORDER MANAGEMENT MAIN/, heroSelector: /<div class="page-heading">([\s\S]*?)<\/div>/, wrapperSelector: /(<div class="stat-cards">[\s\S]*?)(<\/main>)/ },
    { name: 'revenue.html', styleMarker: /REVENUE PAGE STYLES/, heroSelector: /<div class="rev-header">([\s\S]*?)<\/div>/, wrapperSelector: /(<div class="stat-cards">[\s\S]*?)(<\/main>)/ }
  ];
  
  for (const f of files) {
    let content = fs.readFileSync(f.name, 'utf8');
    
    // Replace header
    content = content.replace(/<header>[\s\S]*?<\/header>/, topbarHtml);
    
    // Clean up old main wrapper
    content = content.replace(/<main[^>]*>\s*(<div class="container">)?/, '<main class="page-shell" id="pageMain">\n');
    
    // Update styles
    const specificStyleMatch = content.match(f.styleMarker);
    if (specificStyleMatch) {
      const styleStartIdx = content.indexOf('<style>') + 7;
      let specificStyleIndex = content.lastIndexOf('/*', specificStyleMatch.index);
      if (specificStyleIndex === -1 || specificStyleIndex < styleStartIdx) {
        specificStyleIndex = specificStyleMatch.index;
      }
      const beforeStyle = content.substring(0, styleStartIdx);
      const specificStyles = content.substring(specificStyleIndex);
      content = beforeStyle + '\n' + profileCss + '\n' + specificStyles;
    }
    
    // Make hero card
    const heroMatch = content.match(f.heroSelector);
    if (heroMatch) {
      content = content.replace(f.heroSelector, `<section class="hero-card">\n<div>\n${heroMatch[1]}\n</div>\n</section>`);
    }
    
    // Wrap main content
    content = content.replace(f.wrapperSelector, '<section class="profile-card">\n$1\n</section>\n$2');
    
    // Close page-shell
    content = content.replace(/<\/div>\s*<\/main>/, '</main>');
    
    fs.writeFileSync(f.name, content, 'utf8');
  }
  
  console.log('Successfully updated the other 3 layout pages!');
} catch (e) {
  console.error(e);
}
