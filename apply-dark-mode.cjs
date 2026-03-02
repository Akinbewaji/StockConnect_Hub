const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /\bbg-white(?!\s+dark:bg-slate-800)\b/g, replacement: 'bg-white dark:bg-slate-800' },
  { regex: /\bbg-gray-50(?!\s+dark:bg-slate-900)\b/g, replacement: 'bg-gray-50 dark:bg-slate-900' },
  { regex: /\btext-gray-900(?!\s+dark:text-white)\b/g, replacement: 'text-gray-900 dark:text-white' },
  { regex: /\btext-gray-800(?!\s+dark:text-slate-100)\b/g, replacement: 'text-gray-800 dark:text-slate-100' },
  { regex: /\btext-gray-700(?!\s+dark:text-slate-200)\b/g, replacement: 'text-gray-700 dark:text-slate-200' },
  { regex: /\btext-gray-600(?!\s+dark:text-slate-300)\b/g, replacement: 'text-gray-600 dark:text-slate-300' },
  { regex: /\btext-gray-500(?!\s+dark:text-slate-400)\b/g, replacement: 'text-gray-500 dark:text-slate-400' },
  { regex: /\btext-gray-400(?!\s+dark:text-slate-500)\b/g, replacement: 'text-gray-400 dark:text-slate-500' },
  { regex: /\bborder-gray-100(?!\s+dark:border-slate-700)\b/g, replacement: 'border-gray-100 dark:border-slate-700' },
  { regex: /\bborder-gray-200(?!\s+dark:border-slate-700)\b/g, replacement: 'border-gray-200 dark:border-slate-700' },
  { regex: /\bborder-gray-300(?!\s+dark:border-slate-600)\b/g, replacement: 'border-gray-300 dark:border-slate-600' }
];

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        processDir(fullPath);
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      for (const {regex, replacement} of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          modified = true;
        }
      }
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Modified:', fullPath);
      }
    }
  }
}

// Process CustomerWeb/src
processDir(path.join(__dirname, 'CustomerWeb', 'src'));
// Process Frontend/src
processDir(path.join(__dirname, 'Frontend', 'src'));

console.log('Dark mode classes applied automatically!');
