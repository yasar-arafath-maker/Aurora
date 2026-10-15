const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');

const dir = __dirname;
const remoteUrl = 'https://github.com/yasar-arafath-maker/Aurora.git';

const IGNORED = new Set([
  '.git',
  'node_modules',
  'venv',
  '.venv',
  'env',
  '.env',
  '__pycache__',
  '.pytest_cache',
  'dist',
  'build'
]);

function getAllFiles(currentDir, baseDir = currentDir) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    if (IGNORED.has(entry.name) || entry.name.endsWith('.log') || entry.name.endsWith('.pyc')) {
      continue;
    }
    const fullPath = path.join(currentDir, entry.name);
    const relPath = path.relative(baseDir, fullPath).split(path.sep).join('/');

    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, baseDir));
    } else {
      files.push(relPath);
    }
  }
  return files;
}

async function run() {
  console.log('=== Initializing Git Repository for Aurora ===');
  console.log('Target Directory:', dir);

  // 1. Remove old .git if corrupted/incomplete
  if (fs.existsSync(path.join(dir, '.git'))) {
    fs.rmSync(path.join(dir, '.git'), { recursive: true, force: true });
    console.log('✓ Cleaned existing .git metadata.');
  }

  // 2. Git Init
  await git.init({ fs, dir, defaultBranch: 'main' });
  console.log('✓ Git repository initialized with default branch "main".');

  // 3. Set Remote Origin
  await git.addRemote({
    fs,
    dir,
    remote: 'origin',
    url: remoteUrl,
    force: true
  });
  console.log('✓ Remote "origin" set to:', remoteUrl);

  // 4. Discover and Stage Files
  const filesToStage = getAllFiles(dir);
  console.log(`Found ${filesToStage.length} project files to stage.`);

  for (let i = 0; i < filesToStage.length; i++) {
    const file = filesToStage[i];
    await git.add({ fs, dir, filepath: file });
  }
  console.log(`✓ All ${filesToStage.length} files staged into Git index.`);

  // 5. Commit
  const sha = await git.commit({
    fs,
    dir,
    author: {
      name: 'yasar-arafath-maker',
      email: 'yasar.arafath@aurora.io'
    },
    message: 'feat: Complete Aurora Solar Intelligence Platform & 3D Solar Studio Suite\n\n' +
             '• Dedicated 3D Solar Array Twin & Photovoltaic SCADA Studio (SolarPage.tsx)\n' +
             '• Interactive Three.js r160 WebXR Solar Rooftop Simulator (SolarFit AR v2)\n' +
             '• Multi-Criteria Decision Analysis (MCDA) Physics & Explainable AI (XAI) Engine\n' +
             '• FLIR Ironbow IR Thermal Cam, Wind Flow Aerodynamics, 3D Module HUDs & Shade Obstacle\n' +
             '• Dynamic 3D Array & Tilt Builder (Cols/Rows/Pitch/Setback Clearance)\n' +
             '• 25-Year Solar ROI, LCOE Benchmark & Carbon Offsetting Simulator\n' +
             '• Seamless integration into Aurora Command Center and Sidebar Rail Navigation'
  });

  console.log('✓ Initial commit created successfully!');
  console.log('Commit SHA:', sha);

  const log = await git.log({ fs, dir, depth: 1 });
  console.log('Branch HEAD:', log[0].commit.message.split('\n')[0]);
  console.log('Author:', log[0].commit.author.name);
  console.log('Files committed successfully!');
}

run().catch(err => {
  console.error('Git operation error:', err);
  process.exit(1);
});
