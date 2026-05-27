const fs = require('fs');
function replace(file, find, rep) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(find, rep);
  fs.writeFileSync(file, content);
}

replace('app/api/challenges/[id]/route.ts', /console\.error\(\`\[GET \/api\/challenges\/\$\{id\}\]\`, error\);/, "console.error('[GET /api/challenges/[id]]', error);");
replace('app/api/challenges/[id]/route.ts', /console\.error\(\`\[PATCH \/api\/challenges\/\$\{id\}\]\`, error\);/, "console.error('[PATCH /api/challenges/[id]]', error);");

replace('app/api/events/[id]/route.ts', /console\.error\(\`\[DELETE \/api\/events\/\$\{id\}\]\`, error\);/, "console.error('[DELETE /api/events/[id]]', error);");

replace('app/api/log/[date]/route.ts', /console\.error\(\`\[GET \/api\/log\/\$\{date\}\]\`, error\);/, "console.error('[GET /api/log/[date]]', error);");

replace('app/api/recharge/[id]/route.ts', /console\.error\(\`\[PATCH \/api\/recharge\/\$\{id\}\]\`, error\);/, "console.error('[PATCH /api/recharge/[id]]', error);");
replace('app/api/recharge/[id]/route.ts', /console\.error\(\`\[DELETE \/api\/recharge\/\$\{id\}\]\`, error\);/, "console.error('[DELETE /api/recharge/[id]]', error);");

replace('app/api/tasks/[id]/route.ts', /console\.error\(\`\[PATCH \/api\/tasks\/\$\{params\.id\}\]\`, error\);/, "console.error('[PATCH /api/tasks/[id]]', error);");
replace('app/api/tasks/[id]/route.ts', /console\.error\(\`\[DELETE \/api\/tasks\/\$\{params\.id\}\]\`, error\);/, "console.error('[DELETE /api/tasks/[id]]', error);");

replace('app/api/tasks/route.ts', 'const task = await Task.create(parseResult.data);', 'const task = await Task.create(parseResult.data as any);');

replace('components/checkin/CheckInForm.tsx', 'const [entries, setEntries] = useState<Record<string, { status: string, completion_pct?: number, skip_reason?: string }>>({});', 'const [entries, setEntries] = useState<Record<string, { status: string, completion_pct?: number, skip_reason?: string, entry_type?: string }>>({});');

replace('components/dashboard/PillarHealthBar.tsx', '<AlertTriangle className="h-3 w-3 text-amber-400" title="Neglected pillar" />', '<span title="Neglected pillar"><AlertTriangle className="h-3 w-3 text-amber-400" /></span>');

replace('app/dashboard/DashboardClient.tsx', 'const { planData, isLoading, generatePlan, updatePlan } = usePlan();', 'const { plan: planData, isLoading, generatePlan, reorderPlan, lockPlan } = usePlan();');
replace('app/dashboard/DashboardClient.tsx', 'await updatePlan({ plan: newPlanList });', 'await reorderPlan(planData!.date, newPlanList);');
replace('app/dashboard/DashboardClient.tsx', 'await updatePlan({ locked: !planData.locked });', 'await lockPlan(planData!.date, !planData.locked);');
replace('app/dashboard/DashboardClient.tsx', 'await updatePlan({ paused: true, locked: true });', 'await lockPlan(planData!.date, true);');

let dayPlanContent = fs.readFileSync('components/plan/DayPlan.tsx', 'utf8');
dayPlanContent = dayPlanContent.replace(/plan\.map/g, 'plan?.map');
dayPlanContent = dayPlanContent.replace(/plan\.findIndex/g, 'plan?.findIndex');
fs.writeFileSync('components/plan/DayPlan.tsx', dayPlanContent);
