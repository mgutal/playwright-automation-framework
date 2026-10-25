/**
 * Generates the sample Excel workbook and the sample upload files used by the specs.
 * Run: npm run data:generate
 */
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const dir = path.resolve('test-data');
fs.mkdirSync(path.join(dir, 'files'), { recursive: true });

// ---- Excel workbook: one sheet per feature ---------------------------------
const loginData = [
  { testCase: 'valid user', username: 'standard_user', password: 'secret_sauce', expected: 'success', expectedMessage: '' },
  { testCase: 'locked out user', username: 'locked_out_user', password: 'secret_sauce', expected: 'error', expectedMessage: 'Sorry, this user has been locked out.' },
  { testCase: 'wrong password', username: 'standard_user', password: 'wrong_pass', expected: 'error', expectedMessage: 'Username and password do not match any user in our service' },
  { testCase: 'empty username', username: '', password: 'secret_sauce', expected: 'error', expectedMessage: 'Username is required' },
  { testCase: 'empty password', username: 'standard_user', password: '', expected: 'error', expectedMessage: 'Password is required' },
];

const postsData = [
  { testCase: 'create post 1', userId: 1, title: 'First post', body: 'Hello world', expectedStatus: 201 },
  { testCase: 'create post 2', userId: 2, title: 'Second post', body: 'Playwright API testing', expectedStatus: 201 },
  { testCase: 'create post 3', userId: 3, title: 'Third post', body: 'Data driven from Excel', expectedStatus: 201 },
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(loginData), 'LoginData');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(postsData), 'PostsData');
XLSX.writeFile(wb, path.join(dir, 'testdata.xlsx'));

// ---- Sample upload files ---------------------------------------------------
// 1x1 transparent PNG
fs.writeFileSync(
  path.join(dir, 'files', 'sample.png'),
  Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'),
);

fs.writeFileSync(path.join(dir, 'files', 'sample.csv'), 'id,name,email\n1,Alice,alice@example.com\n2,Bob,bob@example.com\n');

// Minimal valid one-page PDF
const pdf = `%PDF-1.1
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj
trailer<</Root 1 0 R>>
%%EOF
`;
fs.writeFileSync(path.join(dir, 'files', 'sample.pdf'), pdf);

// Excel file used as an upload payload
const uploadWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(uploadWb, XLSX.utils.json_to_sheet([{ a: 1, b: 2 }, { a: 3, b: 4 }]), 'Sheet1');
XLSX.writeFile(uploadWb, path.join(dir, 'files', 'sample.xlsx'));

console.log(`Test data written to ${dir}`);
