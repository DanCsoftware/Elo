import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Try both .env and .env.local
const envPaths = [
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env'),
];

let supabaseUrl = '';
let supabaseKey = '';

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`📁 Found env file: ${envPath}`);
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
    
    if (urlMatch) supabaseUrl = urlMatch[1].trim().replace(/["']/g, '');
    if (keyMatch) supabaseKey = keyMatch[1].trim().replace(/["']/g, '');
    
    if (supabaseUrl && supabaseKey) break;
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Make sure .env or .env.local exists with:');
  console.error('VITE_SUPABASE_URL=your-url');
  console.error('VITE_SUPABASE_ANON_KEY=your-key');
  process.exit(1);
}

console.log('✅ Supabase credentials loaded');

const supabase = createClient(supabaseUrl, supabaseKey);

// Load questions-skills.json
const questionsSkillsPath = path.join(process.cwd(), 'src/data/questions-skills.json');

if (!fs.existsSync(questionsSkillsPath)) {
  console.error('❌ questions-skills.json not found at:', questionsSkillsPath);
  console.error('Please create this file first!');
  process.exit(1);
}

const questionsSkills = JSON.parse(fs.readFileSync(questionsSkillsPath, 'utf-8'));

async function updateQuestions() {
  console.log('🚀 Starting question updates...');
  console.log(`📊 Total questions to update: ${questionsSkills.length}`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const question of questionsSkills) {
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          skills: question.skills,
          elo_difficulty: question.elo_difficulty,
        })
        .eq('id', question.id);

      if (error) {
        console.error(`❌ Error updating ${question.id}:`, error.message);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`✅ Updated ${successCount}/${questionsSkills.length} questions...`);
        }
      }
    } catch (err) {
      console.error(`❌ Exception updating ${question.id}:`, err);
      errorCount++;
    }
  }

  console.log('\n🎉 Update complete!');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  if (errorCount > 0) {
    process.exit(1);
  }
}

updateQuestions();