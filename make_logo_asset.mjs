import fs from 'fs';
import path from 'path';

const logoBytes = fs.readFileSync(path.resolve('public/pg-logo.jpg'));
const b64 = logoBytes.toString('base64');
const content = `export const PG_LOGO_DATA_URI = "data:image/jpeg;base64,${b64}";\n`;

fs.writeFileSync(path.resolve('src/lib/pgLogoData.ts'), content);
console.log('Successfully generated src/lib/pgLogoData.ts, length:', content.length);
