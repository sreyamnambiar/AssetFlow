const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'backend', 'src', 'modules');

if (fs.existsSync(modulesDir)) {
    fs.rmSync(modulesDir, { recursive: true, force: true });
    console.log('Successfully removed backend/src/modules directory.');
} else {
    console.log('modules directory not found.');
}
