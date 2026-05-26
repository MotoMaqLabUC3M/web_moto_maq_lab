const fs = require('fs');
let js = fs.readFileSync('assets/js/patrocinadores.js', 'utf8');

// Use a regex to match the if (isEnglish) { ... } else { ... } block
const regex = /if \(isEnglish\) \{\s+const callToActionHTML = [\s\S]*?[^;]+;\s+container\.insertAdjacentHTML\('beforeend', callToActionHTML\);\s+\} else \{\s+const callToActionHTML = [\s\S]*?[^;]+;\s+container\.insertAdjacentHTML\('beforeend', callToActionHTML\);\s+\}/g;

js = js.replace(regex, '');
fs.writeFileSync('assets/js/patrocinadores.js', js, 'utf8');
