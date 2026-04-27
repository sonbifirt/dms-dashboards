import type { MessageKey } from "@/lib/i18n/messages/en";

/** Maps heatmap weekday keys from data to message keys */
export const HEATMAP_DAY_LABEL: Record<string, MessageKey> = {
  Mon: "calendar.mon",
  Tue: "calendar.tue",
  Wed: "calendar.wed",
  Thu: "calendar.thu",
  Fri: "calendar.fri",
  Sat: "calendar.sat",
  Sun: "calendar.sun",
};
