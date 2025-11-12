import { parse } from 'csv-parse/sync';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

const postsCSV = fs.readFileSync('attached_assets/posts_202511120207_1762902469302.csv', 'utf-8');
const posts = parse(postsCSV, {
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  relax_column_count: true
});

const questionPosts = new Map();
posts.filter(p => p.post_number === '1').forEach(post => {
  questionPosts.set(parseInt(post.topic_id), post);
});

// All truncated topic IDs (excluding ones already fixed)
const truncatedTopicIds = [
  182, 239, 241, 243, 244, 311, 361, 363, 367, 380, 392, 394, 400, 407, 415, 
  418, 428, 433, 434, 451, 463, 467, 479, 499, 516, 528, 530, 539, 552, 553, 
  554, 555, 577, 600, 601, 613, 626, 638, 648, 658, 660, 666, 672, 699, 721, 
  752, 813, 815, 825, 827, 829, 834, 835, 845, 850, 855, 856, 863, 878, 879, 
  907, 911, 915, 964, 980, 982, 987, 991, 1011, 1026, 1033, 1060, 1063, 1073, 
  1076, 1089, 1097, 1099, 1103, 1124, 1127, 1150, 1163, 1176, 1189, 1192, 1196, 
  1201, 1203, 1206, 1217, 1255, 1256, 1268, 1279, 1285, 1310, 1317, 1318, 1353, 
  1364, 1375, 1387, 1399, 1402, 1417, 1424, 1427, 1431, 1437
];

let success = 0;
let failed = 0;
let skipped = 0;

console.log(`Processing ${truncatedTopicIds.length} questions...\n`);

for (const topicId of truncatedTopicIds) {
  const post = questionPosts.get(topicId);
  
  if (post && post.raw) {
    const content = post.raw.trim();
    if (content.length > 160 && content.length < 50000) {  // Skip very large content
      try {
        const sql = `UPDATE questions SET content = (SELECT CAST(x'${Buffer.from(content, 'utf-8').toString('hex')}' AS TEXT)) WHERE id = ${topicId}`;
        await execPromise(`npx wrangler d1 execute foodmath --remote --command "${sql}"`);
        
        console.log(`✓ ${topicId} (${content.length} chars)`);
        success++;
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`✗ ${topicId}: ${error.message.substring(0, 60)}`);
        failed++;
      }
    } else {
      skipped++;
    }
  }
}

console.log(`\nDone: ${success} updated, ${failed} failed, ${skipped} skipped`);
