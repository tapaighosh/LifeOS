/**
 * scripts/seedPrinciples.ts
 *
 * Seeds the `principles` collection with an initial set of guiding statements.
 *
 * Idempotent — skips if any documents already exist.
 * Fisher-Yates shuffle assigns a stable show_order (0 … N-1) at seed time.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seedPrinciples.ts
 */

import mongoose from 'mongoose';
import { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// Inline Principle model (avoids @/ path-alias issues in tsx/ts-node context)
// ---------------------------------------------------------------------------
interface IPrinciple extends Document {
  heading: string;
  body: string;
  show_order: number;
  last_shown: string | null;
  active: boolean;
}

const PrincipleSchema = new Schema<IPrinciple>(
  {
    heading: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: 500 },
    show_order: { type: Number, required: true },
    last_shown: { type: String, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
PrincipleSchema.index({ last_shown: 1 });
PrincipleSchema.index({ show_order: 1 });

const Principle: Model<IPrinciple> =
  mongoose.models.Principle ||
  mongoose.model<IPrinciple>('Principle', PrincipleSchema);

// ---------------------------------------------------------------------------
// ✏️  PASTE YOUR PRINCIPLES HERE (50 items)
// Each entry needs a `heading` (max 120 chars) and `body` (max 500 chars).
// ---------------------------------------------------------------------------
const PRINCIPLES: Array<{ heading: string; body: string }> = [
  {
    heading: "Jeff Bezos",
    body: "Do something you are genuinely passionate about. Do not try to chase whatever happens to be the \"hot passion\" of the day."
  },
  {
    heading: "Steve Jobs",
    body: "You have to have a lot of passion for what you are doing because it is so hard that if you don’t, any rational person will give up."
  },
  {
    heading: "Richard Branson",
    body: "Just go and do it. Try things, learn from them, and accept that you will fail at some things—it’s just a learning experience for the next venture."
  },
  {
    heading: "Pierre Omidyar",
    body: "Don't let people you respect tell you something can't be done just because they don't have the courage to try it themselves."
  },
  {
    heading: "Mark Cuban",
    body: "People looking for 'great ideas to make money' aren't nearly as successful as those who ask: What do I love? What am I excited about? What do I know something about?"
  },
  {
    heading: "Larry Page",
    body: "Working on something you think will make a big difference is incredibly rewarding. It brings an energy that makes you more likely to succeed."
  },
  {
    heading: "Elon Musk",
    body: "You must have an emotional investment in what you are doing. If you don't love it, failure is pretty much guaranteed."
  },
  {
    heading: "Bill Gates",
    body: "If you know exactly what you want to be, spend as much time as possible with people who are already successfully doing that exact thing."
  },
  {
    heading: "Steve Wozniak",
    body: "Always question things. Get people to motivate why they think a certain way, and never accept 'this is the way it’s always been done' as a valid answer."
  },
  {
    heading: "Biz Stone",
    body: "Look at your environment and ask: Given everything we have today, is there a way we can make this better?"
  },
  {
    heading: "Aaron Levie",
    body: "Track your own pain points. Take a literal catalog of your day from the moment you wake up, write everything down, and ask where the solvable problems are."
  },
  {
    heading: "James Altucher",
    body: "Come up with 10 ideas every single day. If you don't practice this daily, your 'idea muscle' will completely atrophy."
  },
  {
    heading: "Marc Andreessen",
    body: "Understand that naturally, nobody cares about your idea. The world could care less, so you have to actively persuade them that you are the one person who can execute it."
  },
  {
    heading: "Guy Kawasaki",
    body: "When trying to change the world, you need people to believe in your dream before they can see it, so that they feel inspired to build the necessary ecosystem around it."
  },
  {
    heading: "Jack Dorsey",
    body: "Build things at first for yourself—things that you personally want to exist or use in your daily life."
  },
  {
    heading: "Drew Houston",
    body: "Put yourself in a business that can be ubiquitous and has no limits. If you can't visualize every consumer or business using it, scaling will always be a grind."
  },
  {
    heading: "Peter Thiel",
    body: "You want an idea where you can say, 'I know it sounds like a bad idea, but here is specifically why it's actually a great one.' You want to sound crazy but be right."
  },
  {
    heading: "Reid Hoffman",
    body: "If you aren't experiencing moments of deep doubt, you simply aren't pushing the boundaries of differentiation far enough."
  },
  {
    heading: "Brian Chesky",
    body: "Don't obsess over how to get big fast. Growth happens naturally if you focus strictly on building something super meaningful that the world genuinely needs."
  },
  {
    heading: "Simon Sinek",
    body: "Every organization knows what they do, and some know how, but very few know why. 'Why' is your core purpose, cause, or belief—profit is just a result."
  },
  {
    heading: "Seth Godin",
    body: "People don't just buy a product; they pay for the story around it. Always ask yourself: Why should anyone care about what you are doing?"
  },
  {
    heading: "Paul Graham",
    body: "Test your ideas against this baseline rule: If this project succeeded but you got no money and no personal credit for it, would you still want it to exist in the world?"
  },
  {
    heading: "Chris Sacca",
    body: "Holding an idea close to your chest because you think it's 'too special' to share is a massive mistake. Go talk about it openly."
  },
  {
    heading: "Kevin Systrom",
    body: "Your competitive advantage isn't a hidden idea; it’s your ability to assemble intelligence, form the right teams, and gather learnings while in active motion."
  },
  {
    heading: "Dustin Moskovitz",
    body: "The hardest part of entrepreneurship is just starting. Get the idea out of your head, draw it, or write basic code—you don't have to be the best, you just have to be dangerous enough to make a concept."
  },
  {
    heading: "Ben Silbermann",
    body: "Build a basic concept and show it to the world. You can then attract talented people who are drawn to that initial vision and will make it even better."
  },
  {
    heading: "Tony Fadell",
    body: "A great product maximizes the probability that when someone encounters your website or store, they leave with their specific problem completely solved."
  },
  {
    heading: "Joe Gebbia",
    body: "Start by creating the absolute perfect experience for just one single person. Get that completely right first, then figure out how to scale something great."
  },
  {
    heading: "Peter Diamandis",
    body: "When starting out, do not target giant markets. Go after very small markets and work to dominate them as quickly as possible."
  },
  {
    heading: "Marissa Mayer",
    body: "Actively seek out rigorous, well-thought-out criticism. Feedback from someone who tears down your work constructively is worth its weight in gold."
  },
  {
    heading: "Alexis Ohanian",
    body: "Utilize online communities to pitch your ideas and seek advice. You’ll get global perspectives from people genuinely passionate about the niche."
  },
  {
    heading: "Gary Vaynerchuk",
    body: "Never underestimate anyone you cross paths with, regardless of their rank or role. The smartest leaders gather opinions from everyone in the room."
  },
  {
    heading: "Sam Altman",
    body: "Most startups fail because they made something they thought people wanted, rather than doing the work to ensure they made something people actually wanted."
  },
  {
    heading: "Dennis Crowley",
    body: "Ignore the haters and the negative feedback that says your idea is stupid. If you build prototypes of things you personally love to use, thousands of others will want to use them too."
  },
  {
    heading: "Eric Ries",
    body: "Integrate rigorous, constant testing throughout your product development and marketing cycles rather than relying solely on upfront focus groups."
  },
  {
    heading: "Naval Ravikant",
    body: "Figure out the smallest possible test you can run for a concept, get it out into the wild immediately, and let real customer behavior validate or invalidate it."
  },
  {
    heading: "Jessica Livingston",
    body: "It is completely okay early on to solve small, layered problems. You don't have to start with a massive 'dent in the universe' ambition on day one."
  },
  {
    heading: "Tim Ferriss",
    body: "Use your startup agility to do something exceptionally high-touch for your early users across connection, design, or community—make that your core edge."
  },
  {
    heading: "Jason Fried",
    body: "Spend your budget on teaching and sharing knowledge (like hiring writers) instead of traditional marketing. Build an audience by talking about relevant industry ideas."
  },
  {
    heading: "Max Levchin",
    body: "If you are a technical founder, accept that you cannot do everything yourself. Even if you have the skills to do it all, you shouldn't."
  },
  {
    heading: "Vinod Khosla",
    body: "Find a phenomenal partner. Look explicitly for three uncompromisable traits: very high intelligence, very high energy, and very high integrity."
  },
  {
    heading: "Palmer Luckey",
    body: "If you compromise on integrity, you risk bringing a highly intelligent, incredibly hardworking crook into your business who will actively work against your interests."
  },
  {
    heading: "Daniel Ek",
    body: "The single most critical task when building an early team is ensuring that every single person is explicitly aligned on the company's long-term goals."
  },
  {
    heading: "Tony Hsieh",
    body: "Establish committable core values. These shouldn't be lofty marketing phrases; they must be principles you are willing to hire or fire people over, completely independent of their technical job performance."
  },
  {
    heading: "Sheryl Sandberg",
    body: "Core company values mean having behaviors and principles that you religiously adhere to, where no amount of external data or pressure will sway your conviction."
  },
  {
    heading: "Richard Branson (Virgin)",
    body: "A company is nothing more than a group of people. To lead them well, you must be a great listener, an incredible motivator, and consistent with praise."
  },
  {
    heading: "Jack Dorsey (Square)",
    body: "Praise people intentionally. Just like plants with water, individuals truly flourish and grow when they are recognized and praised by their leadership."
  },
  {
    heading: "Mark Zuckerberg",
    body: "As a founder, view your job as being an assistant to the rest of the company. Your primary duty is to clear roadblocks so everyone else has what they need to succeed."
  },
  {
    heading: "Marc Andreessen (A16Z)",
    body: "Accept early on that a vast amount of external circumstances (like market timing or economic shifts) are entirely out of your control, and be at peace with that reality."
  },
  {
    heading: "Elon Musk (SpaceX)",
    body: "Don't waste energy trying to completely avoid mistakes. You will make tons of them. The defining factor is how fast you learn from them, bounce back, and keep running through walls."
  }
];

// ---------------------------------------------------------------------------
// Fisher-Yates in-place shuffle — returns the same array mutated
// ---------------------------------------------------------------------------
function fisherYatesShuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. ' +
      'Make sure .env.local is loaded before running this script.'
    );
  }

  if (PRINCIPLES.length === 0) {
    console.log(
      '⚠️  PRINCIPLES array is empty.\n' +
      '   Open scripts/seedPrinciples.ts, fill in the PRINCIPLES array, then re-run.'
    );
    process.exit(0);
  }

  console.log('🔌 Connecting to MongoDB…');
  await mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10_000,
    tls: true,
    retryWrites: true,
  });
  console.log('✅ Connected.');

  // --- Idempotency check ---------------------------------------------------
  const existing = await Principle.countDocuments();
  if (existing > 0) {
    console.log(
      `ℹ️  Skipping seed — ${existing} principle(s) already exist in the collection.`
    );
    await mongoose.disconnect();
    return;
  }

  // // --- Clear the previous collection as requested --------------------------
  // console.log('🧹 Clearing previous principles…');
  // await Principle.deleteMany({});
  // console.log('✅ Previous principles cleared.');

  // --- Shuffle to assign show_order ----------------------------------------
  const shuffled = fisherYatesShuffle([...PRINCIPLES]);

  const docs = shuffled.map((p, index) => ({
    heading: p.heading,
    body: p.body,
    show_order: index,       // 0-based position in the rotation cycle
    last_shown: null,        // never shown yet
    active: true,
  }));

  // --- Insert ---------------------------------------------------------------
  const result = await Principle.insertMany(docs);
  console.log(`🌱 Seeded ${result.length} principle(s) successfully.`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
