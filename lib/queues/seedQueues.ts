/**
 * Queue Seed Data + DB Seeder
 *
 * Why DB-seeded instead of a static constant?
 *   Users can add new topics via the [+ Add Topic] flow in the UI. Items need
 *   to live in MongoDB so they're editable at runtime. This seeder runs once
 *   on first connection (idempotent guard: TopicQueue.countDocuments() === 0).
 *
 * The seed is called from lib/db/mongoose.ts after successful connection,
 * alongside any other seed calls.
 */

import TopicQueue from '@/models/TopicQueue';
import TopicItem from '@/models/TopicItem';

// ─── Seed Constant ────────────────────────────────────────────────────────────

interface SeedItem {
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface SeedQueue {
  name: string;
  pillar: 'money' | 'soul' | 'curiosity';
  queue_type: 'concept' | 'dsa';
  description: string;
  items: SeedItem[];
}

export const QUEUE_SEED_DATA: SeedQueue[] = [
  // ─── Queue 1 ───────────────────────────────────────────────────────────────
  {
    name: 'Psychology & Mind',
    pillar: 'curiosity',
    queue_type: 'concept',
    description: 'Understand how the human mind works — biases, emotions, and mental models.',
    items: [
      { title: 'Cognitive Dissonance', difficulty: 'easy' },
      { title: 'Dunning-Kruger Effect', difficulty: 'easy' },
      { title: 'Confirmation Bias', difficulty: 'easy' },
      { title: 'Anchoring Bias', difficulty: 'medium' },
      { title: 'Loss Aversion', difficulty: 'medium' },
      { title: 'Sunk Cost Fallacy', difficulty: 'medium' },
      { title: 'Availability Heuristic', difficulty: 'medium' },
      { title: 'Emotional Regulation', difficulty: 'hard' },
      { title: 'Growth vs Fixed Mindset', difficulty: 'hard' },
    ],
  },

  // ─── Queue 2 ───────────────────────────────────────────────────────────────
  {
    name: 'Power & Systems',
    pillar: 'curiosity',
    queue_type: 'concept',
    description: 'Mental models for thinking clearly and making better decisions.',
    items: [
      { title: 'First Principles Thinking', difficulty: 'easy' },
      { title: 'Second-Order Thinking', difficulty: 'medium' },
      { title: 'Inversion', difficulty: 'easy' },
      { title: 'Pareto Principle', difficulty: 'easy' },
      { title: 'Circle of Competence', difficulty: 'medium' },
      { title: 'Mental Models', difficulty: 'medium' },
      { title: 'Feedback Loops', difficulty: 'medium' },
      { title: 'Game Theory Basics', difficulty: 'hard' },
      { title: 'Network Effects', difficulty: 'hard' },
    ],
  },

  // ─── Queue 3 ───────────────────────────────────────────────────────────────
  {
    name: 'Money & Wealth Logic',
    pillar: 'money',
    queue_type: 'concept',
    description: 'Financial fundamentals every person should know.',
    items: [
      { title: 'Compound Interest', difficulty: 'easy' },
      { title: 'Opportunity Cost', difficulty: 'easy' },
      { title: 'Time Value of Money', difficulty: 'easy' },
      { title: 'Diversification', difficulty: 'easy' },
      { title: 'Asset vs Liability', difficulty: 'easy' },
      { title: 'Inflation Mechanics', difficulty: 'medium' },
      { title: 'Tax-Efficient Investing', difficulty: 'medium' },
      { title: 'Emergency Fund Logic', difficulty: 'easy' },
      { title: 'Net Worth Calculation', difficulty: 'easy' },
    ],
  },

  // ─── Queue 4 ───────────────────────────────────────────────────────────────
  {
    name: 'Lifestyle Concepts',
    pillar: 'curiosity',
    queue_type: 'concept',
    description: 'Evidence-based concepts for health, habits, relationships, and peak performance.',
    items: [
      { title: 'Deep Work', difficulty: 'medium' },
      { title: 'Atomic Habits Principles', difficulty: 'easy' },
      { title: 'Sleep Hygiene', difficulty: 'easy' },
      { title: 'Circadian Rhythm', difficulty: 'medium' },
      { title: '80/20 Principle', difficulty: 'easy' },
      { title: 'Mindful Eating', difficulty: 'easy' },
      { title: 'Active Listening', difficulty: 'medium' },
      { title: 'Non-Violent Communication', difficulty: 'medium' },
      { title: 'Body Language Basics', difficulty: 'easy' },
      { title: 'Stoicism Basics', difficulty: 'medium' },
      { title: 'Ikigai Framework', difficulty: 'medium' },
      { title: 'Digital Minimalism', difficulty: 'easy' },
      { title: 'Intermittent Fasting Basics', difficulty: 'easy' },
      { title: 'HIIT vs Steady State', difficulty: 'easy' },
      { title: 'Progressive Overload', difficulty: 'medium' },
      { title: 'Cold Exposure Benefits', difficulty: 'medium' },
      { title: 'Breathing Techniques (Wim Hof)', difficulty: 'medium' },
      { title: 'Journaling Methods', difficulty: 'easy' },
      { title: 'Gratitude Practice', difficulty: 'easy' },
      { title: 'Meditation Types', difficulty: 'medium' },
      { title: 'Reading Effectively', difficulty: 'easy' },
      { title: 'Zettelkasten Note-Taking', difficulty: 'hard' },
      { title: 'Energy Management vs Time Management', difficulty: 'medium' },
      { title: 'Social Battery Concept', difficulty: 'easy' },
      { title: 'Conflict Resolution Styles', difficulty: 'medium' },
      { title: 'Emotional Intelligence Components', difficulty: 'medium' },
      { title: 'Public Speaking Basics', difficulty: 'medium' },
      { title: 'Negotiation Basics', difficulty: 'medium' },
      { title: 'Networking Authentically', difficulty: 'medium' },
      { title: 'Personal Brand Basics', difficulty: 'medium' },
      { title: 'Goal Setting (SMART vs OKR)', difficulty: 'medium' },
      { title: 'Dopamine Detox', difficulty: 'medium' },
      { title: 'Accountability Systems', difficulty: 'medium' },
      { title: 'Habit Stacking', difficulty: 'easy' },
    ],
  },

  // ─── Queue 5 (DSA) ─────────────────────────────────────────────────────────
  {
    name: 'DSA Problems',
    pillar: 'money',
    queue_type: 'dsa',
    description: 'Data structures and algorithms — from fundamentals to interview-hard problems.',
    items: [
      // Easy (10)
      { title: 'Two Sum', difficulty: 'easy' },
      { title: 'Reverse a String', difficulty: 'easy' },
      { title: 'Check Palindrome', difficulty: 'easy' },
      { title: 'Find Maximum Element', difficulty: 'easy' },
      { title: 'Count Occurrences', difficulty: 'easy' },
      { title: 'Fibonacci (iterative)', difficulty: 'easy' },
      { title: 'FizzBuzz Logic', difficulty: 'easy' },
      { title: 'Array Rotation', difficulty: 'easy' },
      { title: 'Sum of Digits', difficulty: 'easy' },
      { title: 'Binary Search', difficulty: 'easy' },
      // Medium (10)
      { title: 'Linked List Reversal', difficulty: 'medium' },
      { title: 'Detect Cycle in Linked List', difficulty: 'medium' },
      { title: 'Valid Parentheses', difficulty: 'medium' },
      { title: 'Merge Two Sorted Arrays', difficulty: 'medium' },
      { title: "Maximum Subarray (Kadane's)", difficulty: 'medium' },
      { title: 'Level Order Traversal', difficulty: 'medium' },
      { title: 'Top K Frequent Elements', difficulty: 'medium' },
      { title: 'Valid Anagram', difficulty: 'medium' },
      { title: '3Sum', difficulty: 'medium' },
      { title: 'Coin Change (DP intro)', difficulty: 'medium' },
      // Hard (10)
      { title: 'Longest Common Subsequence', difficulty: 'hard' },
      { title: 'Word Break', difficulty: 'hard' },
      { title: 'Number of Islands', difficulty: 'hard' },
      { title: 'Serialize/Deserialize Binary Tree', difficulty: 'hard' },
      { title: 'Merge K Sorted Lists', difficulty: 'hard' },
      { title: 'Trapping Rain Water', difficulty: 'hard' },
      { title: 'Minimum Window Substring', difficulty: 'hard' },
      { title: 'Alien Dictionary', difficulty: 'hard' },
      { title: 'Regular Expression Matching', difficulty: 'hard' },
      { title: 'Sliding Window Maximum', difficulty: 'hard' },
    ],
  },
];

// ─── Seeder Function ──────────────────────────────────────────────────────────

/**
 * Seeds all 5 queues and their items if the topic_queues collection is empty.
 *
 * Idempotent: calling this multiple times is safe — the countDocuments()
 * guard means nothing happens if queues already exist. This is important in
 * production where multiple serverless function cold starts can race.
 */
export async function seedQueuesIfEmpty(): Promise<void> {
  try {
    const existing = await TopicQueue.countDocuments();
    if (existing > 0) {
      // Already seeded — skip (idempotent guard)
      return;
    }

    console.log('[seedQueues] Seeding 5 topic queues...');

    for (const queueData of QUEUE_SEED_DATA) {
      const queue = await TopicQueue.create({
        name: queueData.name,
        pillar: queueData.pillar,
        queue_type: queueData.queue_type,
        description: queueData.description,
        active: true,
      });

      const items = queueData.items.map((item, index) => ({
        queue_id: queue._id,
        title: item.title,
        difficulty: item.difficulty,
        order: index,
        status: 'pending' as const,
      }));

      await TopicItem.insertMany(items);
      console.log(`[seedQueues] Seeded "${queue.name}" with ${items.length} items`);
    }

    console.log('[seedQueues] Done — 5 queues seeded successfully');
  } catch (err) {
    // Seed errors must never crash the app — log and continue
    console.error('[seedQueues] Seeding failed:', err);
  }
}
