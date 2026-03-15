const fs = require('fs');
const file = './src/components/sections/SettingsPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// We want to replace text-white with text-text-main, 
// EXCEPT where it's part of the danger button (line ~293).
content = content.replace(/className="(.*?)(text-white)(.*?)"/g, (match, p1, p2, p3) => {
    if (match.includes("bg-danger")) return match;
    return `className="${p1}text-text-main${p3}"`;
});

// Also replace hover:text-white with hover:text-text-main
content = content.replace(/hover:text-white/g, "hover:text-text-main");

fs.writeFileSync(file, content);
