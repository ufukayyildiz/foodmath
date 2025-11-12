import { parse } from 'csv-parse/sync';
import fs from 'fs';

// Read the posts CSV file
const postsCSV = fs.readFileSync('attached_assets/posts_202511120207_1762902469302.csv', 'utf-8');

// Parse CSV with proper handling of quotes and newlines
const posts = parse(postsCSV, {
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  relax_column_count: true
});

console.log(`Loaded ${posts.length} posts from CSV`);

// Get all question posts (post_number = 1)
const questions = posts.filter(p => p.post_number === '1');
console.log(`Found ${questions.length} question posts`);

// Get truncated questions from DB (those ending with ...)
const truncatedTopicIds = [
  13, 18, 79, 173, 179, 182, 239, 241, 243, 244, 311, 528, 530, 539, 552, 553, 554, 600, 613, 672, 699, 907, 911, 915
];

console.log('\nChecking truncated questions:');
console.log('='.repeat(80));

for (const topicId of truncatedTopicIds.slice(0, 5)) { // Check first 5
  const post = questions.find(q => parseInt(q.topic_id) === topicId);
  if (post) {
    const content = post.raw || '';
    console.log(`\nTopic ${topicId}:`);
    console.log(`Content length: ${content.length} chars`);
    console.log(`First 200 chars: ${content.substring(0, 200)}`);
    console.log('-'.repeat(80));
  } else {
    console.log(`\nTopic ${topicId}: NOT FOUND in posts CSV`);
  }
}
