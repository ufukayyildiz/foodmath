import { parse } from 'csv-parse/sync';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Read and parse the posts CSV
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

const truncatedTopicIds = [13, 18, 79, 173, 179];  // Start with just 5

console.log(`Updating ${truncatedTopicIds.length} questions...\n`);

let success = 0;
let failed = 0;

for (const topicId of truncatedTopicIds) {
  const post = questionPosts.get(topicId);
  
  if (post && post.raw) {
    const content = post.raw.trim();
    if (content.length > 160) {
      try {
        // Base64 encode the content to avoid escaping issues
        const base64Content = Buffer.from(content).toString('base64');
        
        // Use a safer UPDATE approach with hex encoding
        const sql = `UPDATE questions SET content = (SELECT CAST(x'${Buffer.from(content, 'utf-8').toString('hex')}' AS TEXT)) WHERE id = ${topicId}`;
        
        const { stdout, stderr } = await execPromise(`npx wrangler d1 execute foodmath --remote --command "${sql}"`);
        
        console.log(`✓ Updated question ${topicId} (${content.length} chars)`);
        success++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`✗ Failed to update question ${topicId}:`, error.message.substring(0, 100));
        failed++;
      }
    }
  }
}

console.log(`\nCompleted: ${success} successful, ${failed} failed`);
