const { execFileSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const compiledTest = path.join(root, 'node_modules', '.tmp', 'chat-rendering-tests', 'src', 'utils', 'chatMarkdown.test.js');

execFileSync('npx', ['tsc', '-p', 'tsconfig.chat-rendering-test.json'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

execFileSync(process.execPath, ['--test', compiledTest], {
  cwd: root,
  stdio: 'inherit',
});
