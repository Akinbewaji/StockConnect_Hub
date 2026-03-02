import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const apps = [
  "c:\\Users\\HP\\Desktop\\gomycode\\Africa's Talking\\StockConnect\\CustomerWeb\\src",
  "c:\\Users\\HP\\Desktop\\gomycode\\Africa's Talking\\StockConnect\\Frontend\\src"
];

let changedCount = 0;
apps.forEach(dir => {
  const files = walk(dir);
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content
      .replace(/\bblue-(\d{2,3})\b/g, 'indigo-$1')
      .replace(/\bgray-(\d{2,3})\b/g, 'slate-$1');
    
    if (content !== newContent) {
      fs.writeFileSync(file, newContent, 'utf8');
      changedCount++;
      console.log('Updated', file);
    }
  });
});
console.log('Total files safely changed:', changedCount);
