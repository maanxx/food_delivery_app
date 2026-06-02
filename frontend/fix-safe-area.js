const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const dirs = ['d:/EASTY/food_delivery_appchat/frontend/src', 'd:/EASTY/food_delivery_appchat/frontend/app'];
let files = [];
dirs.forEach(d => {
    if (fs.existsSync(d)) {
        files = files.concat(walk(d));
    }
});

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    const rnImportRegex = /import\s+{([^}]*?)}\s+from\s+['"]react-native['"];?/g;
    
    let needsUpdate = false;
    let newContent = content.replace(rnImportRegex, (match, p1) => {
        if (p1.includes('SafeAreaView')) {
            needsUpdate = true;
            let newImports = p1.replace(/\bSafeAreaView\b\s*,?\s*/g, '').trim();
            newImports = newImports.replace(/,\s*$/, '');
            newImports = newImports.replace(/,\s*,/g, ',');
            
            if (newImports.length === 0) {
                return ''; 
            } else {
                return `import { ${newImports} } from 'react-native';`;
            }
        }
        return match;
    });
    
    if (needsUpdate) {
        const firstImportIndex = newContent.indexOf('import ');
        const importStatement = `import { SafeAreaView } from 'react-native-safe-area-context';\n`;
        if (firstImportIndex !== -1) {
            newContent = newContent.slice(0, firstImportIndex) + importStatement + newContent.slice(firstImportIndex);
        } else {
            newContent = importStatement + newContent;
        }
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Fixed', file);
    }
});
