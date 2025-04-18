const esbuild = require('esbuild');
const { execSync } = require('child_process');

async function build() {
  try {
    // emit declarations only
    execSync('tsc --emitDeclarationOnly', { stdio: 'inherit' });

    // cjs output
    await esbuild.build({
      entryPoints: ['src/index.ts'],
      outfile: 'dist/index.js',
      bundle: true,
      sourcemap: true,
      platform: 'node',
      target: 'node14',
      format: 'cjs',
      external: ['esbuild']
    });

    console.log('✅ Build complete!');
  } catch (error) {
    console.log('❌ Build failed!');
    console.error(error);
    process.exit(1);
  }
}

build();
