import type { MessageKey } from "@/lib/i18n/messages/en";

const KIOSK_STATUS_MAP: Record<string, MessageKey> = {
  OK: "kioskStatus.OK",
  "Paper Warning": "kioskStatus.PaperWarning",
  Error: "kioskStatus.Error",
  Disabled: "kioskStatus.Disabled",
  "Not Found": "kioskStatus.NotFound",
};

export function translateKioskStatus(
  name: string,
  t: (key: MessageKey, vars?: Record<string, string | number>) => string
): string {
  const key = KIOSK_STATUS_MAP[name];
  return key ? t(key) : name;
}
