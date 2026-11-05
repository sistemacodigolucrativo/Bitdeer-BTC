import { MemberData } from '../services/api';

/**
 * Visual interpolation ONLY. PHP and SQLite remain authoritative for all
 * rewards, accounting, withdrawals, and plan limits.
 * Freeze after 8 seconds without a server snapshot to avoid stale projections.
 */
export function projectInternalBalance(
  snapshot: MemberData | null,
  snapshotReceivedAtMs: number,
  nowMs: number,
): number {
  if (!snapshot) return 0;
  const units = Math.max(0, snapshot.mining.balanceUnits);
  if (!snapshot.mining.running) return units / 864000000;
  const elapsed = Math.max(0, Math.min(8, Math.floor((nowMs-snapshotReceivedAtMs)/1000)));
  const serverNow = snapshot.asOf;
  const cap = Math.min(
    snapshot.mining.sessionEndsAt ?? Number.POSITIVE_INFINITY,
    snapshot.plan.expiresAt ?? Number.POSITIVE_INFINITY,
    serverNow+elapsed,
  );
  const seconds = Math.max(0, Math.floor(cap-serverNow));
  // PHP settles in whole seconds at (daily_cents * 100) units per second.
  const cents = Math.round(Number(snapshot.plan.dailyUsd) * 100);
  return (units + seconds * cents * 100) / 864000000;
}
