import type { MessageKey } from "@/lib/i18n/messages/en";

export function merchantStatusLabel(
  status: string,
  t: (k: MessageKey, v?: Record<string, string | number>) => string
) {
  if (status === "Active") return t("common.merchantStatusActive");
  if (status === "Inactive") return t("common.merchantStatusInactive");
  return status;
}
