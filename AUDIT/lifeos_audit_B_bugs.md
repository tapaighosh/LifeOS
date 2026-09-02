# LifeOS Audit — Section B: Critical Bugs (24 Issues)

| ID | Sev | Feature | Problem | Expected | Actual | Fix |
|----|-----|---------|---------|----------|--------|-----|
| BUG-01 | P0 | Plan expiry | Past-day `pending` entries never expire | Expired at midnight | Appear as carryovers indefinitely | Midnight cron: `pending` → `expired` |
| BUG-02 | P0 | Plan generation | Concurrent POSTs both pass `locked` check | Only one generation runs | Silent plan overwrite | Atomic generation lock flag + TTL |
| BUG-03 | P0 | AI validation | Hallucinated `task_id` passes Zod, stored in DB | IDs verified against DB | Invalid IDs corrupt plan | Post-Zod DB existence check |
| BUG-04 | P0 | Queue topics | Rule-based assigns `time_start: '00:00'` for queue topics | Real time slot | Midnight displayed in UI | Assign real slots from available windows |
| BUG-05 | P0 | Queue topics | Zod requires `task_id` (required) but queue topics have `topic_item_id` | Both field types accepted | Queue topics fail Zod → fallback → `00:00` | Discriminated union schema |
| BUG-06 | P0 | Check-in | Submitting twice increments `total_completed` twice | Idempotent | Duplicate increments | `is_submitted` guard returns 409 |
| BUG-07 | P1 | Timezone | `toISOString()` returns UTC date, wrong for IST after 6:30 PM | Local date | UTC date | `date-fns-tz` with `UserSettings.timezone` |
| BUG-08 | P1 | slotCalculator | `new Date(dateStr)` → UTC midnight, `setHours()` → local time mismatch | Correct slot times | Slots shifted 5.5h for IST users | Use `fromZonedTime` consistently |
| BUG-09 | P1 | Streak | Completing task twice same day increments `total_completed` twice | Once per day | Twice | Guard: `if (last_completed_on === date) skip` |
| BUG-10 | P1 | add-task | No overlap check when adding task to plan | Reject overlapping entries | Silently overlaps | Check existing plan entries for conflict |
| BUG-11 | P1 | add-task | No window validation — can add task at commute times | Reject out-of-window | Any time accepted | Validate against `calculateAvailableSlots()` |
| BUG-12 | P1 | revisionEngine | `completeRevision()` uses `new Date()` not completion date | Consistent date math | Off-by-hours near midnight | Use passed `date` param as base |
| BUG-13 | P1 | revisionEngine | `onTaskCompleted()` sets `cycle_index = 1` on re-completion — skips first interval | Restart from `cycle[0]` | Starts at `cycle[1]` | Set `cycle_index = 0` then advance |
| BUG-14 | P1 | Carryover | `pending` entries include tasks user never saw (plan generated, app closed) | Only in-progress tasks carried | All untouched tasks carried | Add `planned` status distinct from `in_progress` |
| BUG-15 | P1 | UserSettings | `delete mongoose.models.UserSettings` on every hot-reload destroys model | Singleton pattern | Model nuked in dev; unstable in prod | Use `mongoose.models.X \|\| mongoose.model(...)` |
| BUG-16 | P1 | Events | Travel prep task pillar hardcoded to `'money'` in `rescheduleHandler.ts` line 14 | User confirms pillar | Always `money` | Prompt user or default to `'soul'` |
| BUG-17 | P1 | Events | `skipped_tasks` used for both AI overflow AND event displacement | Separate arrays | Same array | Add `displaced_tasks: ObjectId[]` to `DailyPlan` |
| BUG-18 | P2 | Middleware | Regex `\$` matches literal `$` not end-of-string; root `/` protection unreliable | `/` always public | May be intercepted | Fix regex pattern, test root without session |
| BUG-19 | P2 | Plan PATCH | `PATCH /api/plan` accepts unvalidated `plan` array from body (line 43) | Server validates entries | Any shape written to DB | Add Zod validation for plan entries |
| BUG-20 | P2 | Pillar balance | Neglected pillar threshold hardcoded `< 15%` ignoring `UserSettings.pillar_balance_target` | Uses user target | Ignores user config | `neglected = pct < (target × 0.6)` |
| BUG-21 | P2 | Revision | `endOfDay.setHours(23,59,59)` in local time but date string is UTC | Correct day boundary | Off-by-one possible | Normalize to user's timezone |
| BUG-22 | P2 | Check-in | Tomorrow preview fetches top 3 by priority ignoring task frequency | Frequency-aware preview | Weekly tasks shown on wrong days | Apply `isTaskDueToday()` to preview date |
| BUG-23 | P2 | Check-in | `$set: { ai_insight: null }` before AI runs; stays null permanently on AI failure | Insight generated then saved | Permanently null on failure | Generate insight first, then `$set`; or use `$setOnInsert` |
| BUG-24 | P3 | Recharge | `Math.random()` recharge selection can repeat same item morning and evening | Variety across slots | Possible duplicate recharge blocks | Shuffle pool, pick sequentially across slots |

---

## Detailed Notes on P0 Bugs

### BUG-02 — Concurrent Plan Generation Race

**Root cause:** [`generate/route.ts`](file:///c:/Users/user/Desktop/Project/LifeOS/app/api/plan/generate/route.ts#L27) line 27 reads `locked` with `findOne`. Then calls AI. Then writes with `findOneAndUpdate` upsert. Two requests can both pass the read before either writes. MongoDB's `$set` with `upsert` is a blind overwrite — no CAS.

**Fix:**
```typescript
// BEFORE calling AI — atomic check-and-lock
const lockResult = await DailyPlan.findOneAndUpdate(
  { date, $or: [{ generating: { $ne: true } }, { generating: { $exists: false } }] },
  { $set: { generating: true, generating_since: new Date() } },
  { upsert: true, new: true }
);
// If the doc already had generating: true, findOneAndUpdate returns null -> abort
// Add TTL index on generating_since (expire after 120s) to handle crashes
```

---

### BUG-05 — Queue Topic Zod Schema Mismatch

**Root cause:** [`responseParser.ts`](file:///c:/Users/user/Desktop/Project/LifeOS/lib/ai/responseParser.ts) current schema:
```typescript
const aiEntrySchema = z.object({
  task_id: z.string(),   // REQUIRED — queue topics have no task_id
  time_start: z.string(),
  time_end: z.string(),
  ...
});
```

**Fix:**
```typescript
const taskEntrySchema = z.object({
  entry_type: z.literal('task'),
  task_id: z.string(),
  time_start: z.string().regex(/^\d{2}:\d{2}$/),
  time_end: z.string().regex(/^\d{2}:\d{2}$/),
  title: z.string(),
  pillar: z.enum(['money', 'soul', 'curiosity']),
});

const queueTopicEntrySchema = z.object({
  entry_type: z.literal('queue_topic'),
  topic_item_id: z.string(),
  time_start: z.string().regex(/^\d{2}:\d{2}$/),
  time_end: z.string().regex(/^\d{2}:\d{2}$/),
  title: z.string(),
  pillar: z.enum(['money', 'soul', 'curiosity']),
});

const aiEntrySchema = z.discriminatedUnion('entry_type', [taskEntrySchema, queueTopicEntrySchema]);
```

---

### BUG-15 — UserSettings Mongoose Model Deletion

**Root cause:** [`models/UserSettings.ts`](file:///c:/Users/user/Desktop/Project/LifeOS/models/UserSettings.ts) line 97:
```typescript
delete mongoose.models.UserSettings;  // THIS DESTROYS THE MODEL
export default mongoose.model<IUserSettings>('UserSettings', userSettingsSchema);
```

**Fix:**
```typescript
export default mongoose.models.UserSettings as mongoose.Model<IUserSettings>
  || mongoose.model<IUserSettings>('UserSettings', userSettingsSchema);
```
