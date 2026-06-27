const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Movie Recap Auto - Setup Script\n');

const steps = [
  {
    name: 'Installing dependencies',
    command: 'npm install',
  },
  {
    name: 'Setting up environment file',
    action: () => {
      const envExample = path.join(__dirname, '..', '.env.local.example');
      const envFile = path.join(__dirname, '..', '.env.local');
      
      if (fs.existsSync(envFile)) {
        console.log('  ✓ .env.local already exists');
        return;
      }

      const content = `# OpenRouter API Key - Get yours at https://openrouter.ai/keys
OPENROUTER_API_KEY=your_api_key_here

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
`;
      fs.writeFileSync(envFile, content);
      console.log('  ✓ Created .env.local');
    },
  },
];

async function runSetup() {
  for (const step of steps) {
    console.log(`\n📋 ${step.name}...`);
    
    if (step.command) {
      try {
        execSync(step.command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
        console.log(`  ✅ ${step.name} completed`);
      } catch (error) {
        console.error(`  ❌ ${step.name} failed`);
        process.exit(1);
      }
    } else if (step.action) {
      step.action();
    }
  }

  console.log('\n✨ Setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Add your OpenRouter API key to .env.local');
  console.log('2. Run npm run dev to start development server');
  console.log('3. Visit http://localhost:3000');
}

runSetup();
