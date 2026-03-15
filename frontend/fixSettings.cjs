const fs = require('fs');
const filepath = './src/components/sections/SettingsPage.jsx';
let content = fs.readFileSync(filepath, 'utf8');

// Replace standard headings and text with text-white
content = content.replace(/className="([^"]*)text-white([^"]*)"/g, (match, prefix, suffix) => {
    // Keep text-white for buttons or specific elements if they have bg-danger or are absolute close buttons
    if (match.includes("bg-danger")) return match;
    return `className="${prefix}text-text-main${suffix}"`;
});

// Fix hover:text-white as well in sidebar links
content = content.replace(/hover:text-white/g, "hover:text-text-main");

// Since Delete Modal title might have been caught, let's keep it consistent
// Actually SettingsPage.jsx has some <h1... text-white> <h2... text-white> <h3... text-white> <h4... text-white>
fs.writeFileSync(filepath, content);
console.log("SettingsPage updated");
