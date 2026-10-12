import type { Badge, BadgeId } from "./badges";

const SEEN_KEY = "nurifit.seen_badges";
const INITIALIZED_KEY = "nurifit.badges_initialized";

function loadSeen(): Set<BadgeId> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as BadgeId[]) : []);
  } catch {
    return new Set();
  }
}

function saveSeen(ids: Set<BadgeId>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

// Returns badges earned since the last check. The very first call on a
// browser baselines whatever's already earned without reporting anything —
// otherwise a returning user with an existing history would get a flood of
// "unlocked" toasts for achievements they earned long ago.
export function checkNewlyEarnedBadges(badges: Badge[]): Badge[] {
  let initialized = true;
  try {
    initialized = localStorage.getItem(INITIALIZED_KEY) === "1";
  } catch {
    // if storage is unavailable, treat every call as already-initialized so
    // we never toast (nothing persists anyway).
  }

  const seen = loadSeen();

  if (!initialized) {
    for (const b of badges) if (b.earned) seen.add(b.id);
    saveSeen(seen);
    try {
      localStorage.setItem(INITIALIZED_KEY, "1");
    } catch {
      // ignore
    }
    return [];
  }

  const newlyEarned = badges.filter((b) => b.earned && !seen.has(b.id));
  if (newlyEarned.length === 0) return [];

  for (const b of newlyEarned) seen.add(b.id);
  saveSeen(seen);
  return newlyEarned;
}
