const { execSync } = require('child_process');

console.log('🚀 Starting deployment...');

try {
  console.log('📦 Building project...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✅ Build successful!');
  console.log('📤 To deploy to Vercel, run: vercel --prod');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
