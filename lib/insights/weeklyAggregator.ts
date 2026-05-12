import DailyPlan from '@/models/DailyPlan';
import DayLog from '@/models/DayLog';
import TopicItem from '@/models/TopicItem';
import TopicQueue from '@/models/TopicQueue';
import { getRevisionsDue } from '@/lib/queues/queueEngine';

export interface WeeklyData {
  weekStart: string;
  weekEnd: string;
  totalTasksScheduled: number;
  totalTasksDone: number;
  completionRate: number;
  pillarBalance: {
    money: { count: number; pct: number };
    soul: { count: number; pct: number };
    curiosity: { count: number; pct: number };
  };
  pillarStreaks: {
    money: number;
    soul: number;
    curiosity: number;
  };
  energyByDay: Array<{ date: string; avg: number | null }>;
  rechargeScheduled: number;
  rechargeDone: number;
  rechargeCompliance: number;
  neglectedPillars: string[];
  queueStats: {
    topicsCoveredThisWeek: number;
    dsaSolvedThisWeek: number;
    revisionsDue: number;
    activeQueues: number;
  };
}

function getWeekRange(anchorDate: string): { weekStart: string; weekEnd: string } {
  const d = new Date(anchorDate);
  const day = d.getUTCDay(); // 0=Sun
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0],
  };
}

export async function aggregateWeeklyData(anchorDate: string): Promise<WeeklyData> {
  const { weekStart, weekEnd } = getWeekRange(anchorDate);

  // Fetch plans for the week
  const plans = await DailyPlan.find({ date: { $gte: weekStart, $lte: weekEnd } }).lean();

  // Fetch day logs for the week
  const dayLogs = await DayLog.find({ date: { $gte: weekStart, $lte: weekEnd } }).lean();

  // --- Completion rate ---
  let totalScheduled = 0;
  let totalDone = 0;
  let moneyDone = 0, soulDone = 0, curiosityDone = 0;
  let rechargeScheduled = 0;
  let rechargeDone = 0;

  // Track per-day pillar completions for streaks
  const datesInWeek: string[] = [];
  {
    const cur = new Date(weekStart);
    const end = new Date(weekEnd);
    while (cur <= end) {
      datesInWeek.push(cur.toISOString().split('T')[0]);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }

  const pillarDoneByDate: Record<string, { money: number; soul: number; curiosity: number }> = {};
  for (const d of datesInWeek) {
    pillarDoneByDate[d] = { money: 0, soul: 0, curiosity: 0 };
  }

  for (const plan of plans) {
    for (const entry of plan.plan) {
      if (entry.type === 'recharge') {
        rechargeScheduled++;
        if (entry.status === 'done') rechargeDone++;
        continue;
      }
      totalScheduled++;
      if (entry.status === 'done') {
        totalDone++;
        if (entry.pillar === 'money') moneyDone++;
        if (entry.pillar === 'soul') soulDone++;
        if (entry.pillar === 'curiosity') curiosityDone++;
        if (pillarDoneByDate[plan.date]) {
          (pillarDoneByDate[plan.date] as any)[entry.pillar] =
            ((pillarDoneByDate[plan.date] as any)[entry.pillar] ?? 0) + 1;
        }
      }
    }
  }

  const completionRate = totalScheduled > 0 ? Math.round((totalDone / totalScheduled) * 100) : 0;
  const total = moneyDone + soulDone + curiosityDone;

  const pillarBalance = {
    money: { count: moneyDone, pct: total ? Math.round((moneyDone / total) * 100) : 0 },
    soul: { count: soulDone, pct: total ? Math.round((soulDone / total) * 100) : 0 },
    curiosity: { count: curiosityDone, pct: total ? Math.round((curiosityDone / total) * 100) : 0 },
  };

  // --- Streaks per pillar: consecutive days with at least 1 task done ---
  const calcStreak = (pillar: 'money' | 'soul' | 'curiosity') => {
    let streak = 0;
    for (const d of [...datesInWeek].reverse()) {
      if ((pillarDoneByDate[d]?.[pillar] ?? 0) > 0) streak++;
      else break;
    }
    return streak;
  };
  const pillarStreaks = {
    money: calcStreak('money'),
    soul: calcStreak('soul'),
    curiosity: calcStreak('curiosity'),
  };

  // --- Energy by day ---
  const energyByDay = datesInWeek.map((date) => {
    const log = dayLogs.find((l) => l.date === date);
    return { date, avg: log?.energy_rating ?? null };
  });

  // --- Recharge compliance ---
  const rechargeCompliance =
    rechargeScheduled > 0 ? Math.round((rechargeDone / rechargeScheduled) * 100) : 100;

  // --- Neglected pillars (< 15%) ---
  const neglectedPillars: string[] = [];
  if (total > 0) {
    if (pillarBalance.money.pct < 15) neglectedPillars.push('money');
    if (pillarBalance.soul.pct < 15) neglectedPillars.push('soul');
    if (pillarBalance.curiosity.pct < 15) neglectedPillars.push('curiosity');
  }

  // --- Queue stats ---
  const today = new Date().toISOString().split('T')[0];
  const [topicsCoveredThisWeek, revisionsDueItems, activeQueues] = await Promise.all([
    TopicItem.countDocuments({ covered_on: { $gte: weekStart }, status: 'covered' }),
    getRevisionsDue(today),
    TopicQueue.countDocuments({ active: true }),
  ]);

  // DSA solved this week = items covered this week from DSA queues
  const dsaQueues = await TopicQueue.find({ queue_type: 'dsa', active: true }).lean();
  const dsaQueueIds = dsaQueues.map((q) => q._id);
  const dsaSolvedThisWeek = await TopicItem.countDocuments({
    queue_id: { $in: dsaQueueIds },
    covered_on: { $gte: weekStart },
    status: 'covered',
  });

  const queueStats = {
    topicsCoveredThisWeek,
    dsaSolvedThisWeek,
    revisionsDue: revisionsDueItems.length,
    activeQueues,
  };

  return {
    weekStart,
    weekEnd,
    totalTasksScheduled: totalScheduled,
    totalTasksDone: totalDone,
    completionRate,
    pillarBalance,
    pillarStreaks,
    energyByDay,
    rechargeScheduled,
    rechargeDone,
    rechargeCompliance,
    neglectedPillars,
    queueStats,
  };
}
