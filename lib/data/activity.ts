import type { LiveActivity } from "./types";
import { kiosks } from "./kiosks";

const KINDS: LiveActivity["kind"][] = ["Cash", "Card"];

function seeded(i: number) {
  const x = Math.sin(i * 12345.67 + 0.789) * 10000;
  return Math.abs(x - Math.floor(x));
}

export function generateLiveActivity(count = 24): LiveActivity[] {
  const active = kiosks.filter((k) => k.totalCount > 0);
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const k = active[i % active.length];
    const kind = KINDS[Math.floor(seeded(i * 3) * 2)];
    const base = kind === "Cash" ? 40 + seeded(i + 1) * 380 : 120 + seeded(i + 2) * 4500;
    const ts = new Date(now - i * (60 + Math.floor(seeded(i + 5) * 240)) * 1000);
    return {
      id: `${k.id}-${i}`,
      timestamp: ts.toISOString(),
      kind,
      entity: `${k.id} · ${k.name}`,
      city: k.city,
      amount: Math.round(base * 100) / 100,
    };
  });
}

export const liveActivity: LiveActivity[] = generateLiveActivity(30);
