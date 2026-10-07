import { spawnSync } from 'node:child_process';

const checks = [
  ['node_modules/typescript/bin/tsc', '-b'],
  ['node_modules/eslint/bin/eslint.js', '.', '--max-warnings', '0'],
  ['node_modules/vitest/vitest.mjs', 'run'],
  ['node_modules/vite/bin/vite.js', 'build'],
];
for (const args of checks) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
