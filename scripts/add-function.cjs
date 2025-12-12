/**
 * Automate `amplify add function` interactive prompts
 * by spawning the CLI and writing answers to stdin.
 */
const { spawn } = require('child_process');

const answers = [
  '',          // Select capability: Lambda function (default)
  'processReceipt', // Function name
  '',          // Select runtime: NodeJS (default)
  '',          // Select template: Hello World (default)
  'n',         // Configure advanced settings? No
  'n',         // Edit function now? No
];

const proc = spawn('amplify', ['add', 'function'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true,
});

let idx = 0;

function sendNext() {
  if (idx < answers.length) {
    const ans = answers[idx];
    console.log(`[add-function] Sending answer #${idx}: "${ans}"`);
    proc.stdin.write(ans + '\n');
    idx++;
    setTimeout(sendNext, 1500); // wait for next prompt
  } else {
    proc.stdin.end();
  }
}

setTimeout(sendNext, 2000); // initial delay for CLI to start

proc.on('close', (code) => {
  console.log(`[add-function] Exited with code ${code}`);
  process.exit(code);
});

