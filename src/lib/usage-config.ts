export const DAILY_AI_LIMIT = 15;

export function dailyUsageWindow(now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const reset = new Date(`${day}T00:00:00.000Z`);
  reset.setUTCDate(reset.getUTCDate() + 1);
  return { day, resetsAt: reset.toISOString() };
}