const fs = require('fs');
const http = require('isomorphic-git/http/node');
const git = require('isomorphic-git');

const dir = __dirname;
const token = process.argv[2] || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

if (!token) {
  console.error('Usage: node push_to_github.js <YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>');
  console.error('Or set GITHUB_TOKEN environment variable.');
  process.exit(1);
}

async function push() {
  console.log('Initiating push to https://github.com/yasar-arafath-maker/Aurora.git...');
  try {
    const res = await git.push({
      fs,
      http,
      dir,
      remote: 'origin',
      ref: 'main',
      onAuth: () => ({
        username: token,
        password: ''
      })
    });
    console.log('✓ Successfully pushed to GitHub main branch!');
    console.log('Push Result:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Push failed:', err.message);
    if (err.data) console.error('Details:', err.data);
    process.exit(1);
  }
}

push();
