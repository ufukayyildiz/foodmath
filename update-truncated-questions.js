import { parse } from 'csv-parse/sync';
import fs from 'fs';

// Read and parse the posts CSV file
const postsCSV = fs.readFileSync('attached_assets/posts_202511120207_1762902469302.csv', 'utf-8');
const posts = parse(postsCSV, {
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  relax_column_count: true
});

// Get all question posts (post_number = 1) as a map: topic_id => post
const questionPosts = new Map();
posts.filter(p => p.post_number === '1').forEach(post => {
  questionPosts.set(parseInt(post.topic_id), post);
});

console.log(`Found ${questionPosts.size} question posts in CSV`);

// List of truncated topic IDs (from database query)
const truncatedTopicIds = [
  13, 18, 79, 173, 179, 182, 239, 241, 243, 244, 311, 331, 332, 333, 334, 359, 
  361, 363, 367, 380, 392, 394, 400, 407, 415, 418, 428, 433, 434, 451, 463, 
  467, 479, 499, 516, 528, 530, 539, 552, 553, 554, 555, 577, 600, 601, 613, 
  626, 638, 648, 658, 660, 666, 672, 699, 721, 752, 813, 815, 825, 827, 829, 
  834, 835, 845, 850, 855, 856, 863, 878, 879, 907, 911, 915, 964, 980, 982, 
  987, 991, 1011, 1026, 1033, 1060, 1063, 1073, 1076, 1089, 1097, 1099, 1103, 
  1124, 1127, 1150, 1163, 1176, 1189, 1192, 1196, 1201, 1203, 1206, 1217, 1255, 
  1256, 1268, 1279, 1285, 1310, 1317, 1318, 1353, 1364, 1375, 1387, 1399, 1402, 
  1417, 1424, 1427, 1431, 1437
];

console.log(`\nProcessing ${truncatedTopicIds.length} truncated questions...\n`);

// Generate SQL UPDATE statements
const updates = [];
let found = 0;
let notFound = 0;

for (const topicId of truncatedTopicIds) {
  const post = questionPosts.get(topicId);
  
  if (post && post.raw) {
    const content = post.raw.trim();
    if (content.length > 160) {  // Only update if significantly longer than truncated
      // Escape single quotes for SQL
      const escapedContent = content.replace(/'/g, "''");
      updates.push(`UPDATE questions SET content = '${escapedContent}' WHERE id = ${topicId};`);
      found++;
      
      if (found <= 5) {
        console.log(`✓ Topic ${topicId}: ${content.length} chars (${content.substring(0, 60)}...)`);
      }
    }
  } else {
    notFound++;
    if (notFound <= 3) {
      console.log(`✗ Topic ${topicId}: Not found in CSV or empty`);
    }
  }
}

console.log(`\n${'='.repeat(80)}`);
console.log(`Summary:`);
console.log(`  Found and will update: ${found} questions`);
console.log(`  Not found or too short: ${notFound} questions`);
console.log(`${'='.repeat(80)}\n`);

// Write SQL file
const sqlContent = `-- Update truncated questions with full content from CSV
-- Generated: ${new Date().toISOString()}
-- Total updates: ${updates.length}

BEGIN TRANSACTION;

${updates.join('\n\n')}

COMMIT;
`;

fs.writeFileSync('fix-truncated-questions.sql', sqlContent);
console.log(`✓ SQL file written to: fix-truncated-questions.sql`);
console.log(`✓ Ready to execute: npx wrangler d1 execute foodmath --remote --file=./fix-truncated-questions.sql`);
