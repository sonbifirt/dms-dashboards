import type {
  PayPointChannelSurface,
  PayPointDashboardGroup,
  PayPointServiceCategory,
} from "@/lib/data/paypoint-cyprus";
import type { MessageKey } from "@/lib/i18n/messages/en";

export const PAYPOINT_DASHBOARD_GROUP_IDS: PayPointDashboardGroup[] = [
  "all",
  "municipalities",
  "mobile",
  "internet",
  "education",
  "subscription",
  "other",
];

export function payPointDashboardGroupLabelKey(g: PayPointDashboardGroup): MessageKey {
  const m: Record<PayPointDashboardGroup, MessageKey> = {
    all: "dashboard.psp.ppCy.group.all",
    municipalities: "dashboard.psp.ppCy.group.municipalities",
    mobile: "dashboard.psp.ppCy.group.mobile",
    internet: "dashboard.psp.ppCy.group.internet",
    education: "dashboard.psp.ppCy.group.education",
    subscription: "dashboard.psp.ppCy.group.subscription",
    other: "dashboard.psp.ppCy.group.other",
  };
  return m[g];
}

export function payPointServiceCategoryLabelKey(c: PayPointServiceCategory): MessageKey {
  const m: Record<PayPointServiceCategory, MessageKey> = {
    tax: "dashboard.psp.ppCy.cat.tax",
    water: "dashboard.psp.ppCy.cat.water",
    baylan: "dashboard.psp.ppCy.cat.baylan",
    smartCard: "dashboard.psp.ppCy.cat.smartCard",
    traffic: "dashboard.psp.ppCy.cat.traffic",
    mobileLoad: "dashboard.psp.ppCy.cat.mobileLoad",
    utility: "dashboard.psp.ppCy.cat.utility",
    educationFee: "dashboard.psp.ppCy.cat.educationFee",
    subscriptionFee: "dashboard.psp.ppCy.cat.subscriptionFee",
    internet: "dashboard.psp.ppCy.cat.internet",
    cardProduct: "dashboard.psp.ppCy.cat.cardProduct",
    other: "dashboard.psp.ppCy.cat.other",
  };
  return m[c];
}

export function payPointChannelLabelKey(ch: PayPointChannelSurface): MessageKey {
  const m: Record<PayPointChannelSurface, MessageKey> = {
    kiosk: "dashboard.psp.ppCy.chan.kiosk",
    webMobile: "dashboard.psp.ppCy.chan.webMobile",
    both: "dashboard.psp.ppCy.chan.both",
  };
  return m[ch];
}
