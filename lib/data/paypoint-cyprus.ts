import { ownProductSnapshot } from "@/lib/data/psp-own-products";

export type PayPointPartnerKind =
  | "municipality"
  | "telco"
  | "utility"
  | "education"
  | "subscription"
  | "internet"
  | "other";

/** Where the bill-payment SKU is exposed */
export type PayPointChannelSurface = "kiosk" | "webMobile" | "both";

export type PayPointServiceCategory =
  | "tax"
  | "water"
  | "baylan"
  | "smartCard"
  | "traffic"
  | "mobileLoad"
  | "utility"
  | "educationFee"
  | "subscriptionFee"
  | "internet"
  | "cardProduct"
  | "other";

export type PayPointPartner = {
  id: string;
  name: string;
  kind: PayPointPartnerKind;
  /** Ops list reference when known */
  externalRef?: number;
  sortOrder: number;
};

export type PayPointService = {
  id: string;
  partnerId: string;
  label: string;
  category: PayPointServiceCategory;
  channels: PayPointChannelSurface;
};

export type PayPointDashboardGroup =
  | "all"
  | "municipalities"
  | "mobile"
  | "internet"
  | "education"
  | "subscription"
  | "other";

const MUNI_DEF: { id: string; name: string; externalRef: number }[] = [
  { id: "muni-gonyeli-alaykoy", name: "Gönyeli Alayköy Municipality", externalRef: 1 },
  { id: "muni-dikmen", name: "Dikmen Municipality", externalRef: 4 },
  { id: "muni-gazimagusa", name: "Gazimağusa Municipality", externalRef: 5 },
  { id: "muni-lac", name: "Laç Municipality", externalRef: 7 },
  { id: "muni-lefke", name: "Lefke Municipality", externalRef: 8 },
  { id: "muni-guzelyurt", name: "Güzelyurt Municipality", externalRef: 9 },
  { id: "muni-mehmetcik-buyukkonuk", name: "Mehmetçik Büyükkonuk Municipality", externalRef: 11 },
  { id: "muni-girne", name: "Girne Municipality", externalRef: 12 },
  { id: "muni-degirmenlik-akincilar", name: "Değirmenlik Akıncılar Municipality", externalRef: 13 },
  { id: "muni-iskele", name: "İskele Municipality", externalRef: 14 },
  { id: "muni-catalkoy-esentepe", name: "Çatalköy Esentepe Municipality", externalRef: 15 },
  { id: "muni-beyarmudu", name: "Beyarmudu Municipality", externalRef: 16 },
  { id: "muni-erenkoy", name: "Erenköy Municipality", externalRef: 17 },
  { id: "muni-yenibogazici", name: "Yeniboğaziçi Municipality", externalRef: 18 },
  { id: "muni-gecitkale-serdarli", name: "Geçitkale Serdarlı Municipality", externalRef: 26 },
  { id: "muni-mesarya", name: "Mesarya Municipality", externalRef: 37 },
];

function muniTemplateServices(partnerId: string): PayPointService[] {
  const rows: Array<{
    label: string;
    category: PayPointServiceCategory;
    channels: PayPointChannelSurface;
  }> = [
    { label: "Property tax", category: "tax", channels: "both" },
    { label: "Water", category: "water", channels: "both" },
    { label: "Baylan", category: "baylan", channels: "both" },
    { label: "Smart card", category: "smartCard", channels: "kiosk" },
    { label: "Traffic", category: "traffic", channels: "webMobile" },
  ];
  return rows.map((r, i) => ({
    id: `${partnerId}-s${i}`,
    partnerId,
    label: r.label,
    category: r.category,
    channels: r.channels,
  }));
}

export const PAYPOINT_PARTNERS: PayPointPartner[] = [
  ...MUNI_DEF.map((m, idx) => ({
    id: m.id,
    name: m.name,
    kind: "municipality" as const,
    externalRef: m.externalRef,
    sortOrder: idx,
  })),
  {
    id: "telco-turkcell-mix",
    name: "Turkcell (PayPoint Web & Kiosk)",
    kind: "telco",
    externalRef: 535,
    sortOrder: 100,
  },
  {
    id: "telco-vodafone-mix",
    name: "Vodafone (PayPoint Web & Kiosk)",
    kind: "telco",
    externalRef: 191,
    sortOrder: 101,
  },
  {
    id: "util-kibtek",
    name: "Kibtek",
    kind: "utility",
    externalRef: 728,
    sortOrder: 110,
  },
  {
    id: "internet-lifecell",
    name: "Lifecell",
    kind: "internet",
    externalRef: 1003,
    sortOrder: 120,
  },
  {
    id: "internet-surfacenet",
    name: "SurfaceNet",
    kind: "internet",
    externalRef: 1310,
    sortOrder: 121,
  },
  {
    id: "edu-near-east",
    name: "Near East University",
    kind: "education",
    externalRef: 44,
    sortOrder: 130,
  },
  {
    id: "edu-kyrenia-uni",
    name: "University of Kyrenia",
    kind: "education",
    externalRef: 45,
    sortOrder: 131,
  },
  {
    id: "sub-architects",
    name: "Chambers of Architects",
    kind: "subscription",
    externalRef: 998,
    sortOrder: 140,
  },
  {
    id: "sub-ktemo",
    name: "KTEMO",
    kind: "subscription",
    externalRef: 1048,
    sortOrder: 141,
  },
  {
    id: "sub-diabetes",
    name: "Kıbrıs Türk Diyabet Derneği",
    kind: "subscription",
    externalRef: 1037,
    sortOrder: 142,
  },
  {
    id: "card-adakart",
    name: "Adakart",
    kind: "other",
    externalRef: 46,
    sortOrder: 150,
  },
];

function telcoUtilityEducationServices(): PayPointService[] {
  return [
    {
      id: "tc-pp-prepaid",
      partnerId: "telco-turkcell-mix",
      label: "Turkcell Prepaid (PayPoint)",
      category: "mobileLoad",
      channels: "both",
    },
    {
      id: "tc-pp-postpaid",
      partnerId: "telco-turkcell-mix",
      label: "Turkcell Postpaid (PayPoint)",
      category: "mobileLoad",
      channels: "both",
    },
    {
      id: "vf-pp-prepaid",
      partnerId: "telco-vodafone-mix",
      label: "Vodafone Prepaid (PayPoint)",
      category: "mobileLoad",
      channels: "both",
    },
    {
      id: "vf-pp-internet",
      partnerId: "telco-vodafone-mix",
      label: "Vodafone Internet (PayPoint)",
      category: "mobileLoad",
      channels: "both",
    },
    {
      id: "kibtek-pp",
      partnerId: "util-kibtek",
      label: "Kibtek (PayPoint Web & Kiosks)",
      category: "utility",
      channels: "both",
    },
    {
      id: "life-pp",
      partnerId: "internet-lifecell",
      label: "Lifecell (PayPoint Web & Kiosks)",
      category: "internet",
      channels: "both",
    },
    {
      id: "surf-pp",
      partnerId: "internet-surfacenet",
      label: "SurfaceNet",
      category: "internet",
      channels: "both",
    },
    {
      id: "neu-fees",
      partnerId: "edu-near-east",
      label: "Near East University payments",
      category: "educationFee",
      channels: "webMobile",
    },
    {
      id: "uok-fees",
      partnerId: "edu-kyrenia-uni",
      label: "University of Kyrenia payments",
      category: "educationFee",
      channels: "webMobile",
    },
    {
      id: "arch-sub",
      partnerId: "sub-architects",
      label: "Annual subscription / e-Permit",
      category: "subscriptionFee",
      channels: "both",
    },
    {
      id: "ktemo-permit",
      partnerId: "sub-ktemo",
      label: "KTEMO permit / visa fees",
      category: "subscriptionFee",
      channels: "both",
    },
    {
      id: "diabetes-donation",
      partnerId: "sub-diabetes",
      label: "Donations & appointments",
      category: "subscriptionFee",
      channels: "webMobile",
    },
    {
      id: "adakart-buy",
      partnerId: "card-adakart",
      label: "Adakart buy / top-up",
      category: "cardProduct",
      channels: "both",
    },
  ];
}

export const PAYPOINT_SERVICES: PayPointService[] = [
  ...MUNI_DEF.flatMap((m) => muniTemplateServices(m.id)),
  ...telcoUtilityEducationServices(),
];

export function payPointCyprusTotalMonthAmount(): number {
  return ownProductSnapshot("paypointCyprus").monthAmount;
}

export function payPointCyprusMonthTx(): number {
  return ownProductSnapshot("paypointCyprus").monthTx;
}

export function payPointCyprusMomPct(): number {
  return ownProductSnapshot("paypointCyprus").momPct;
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h;
}

function weightForService(serviceId: string): number {
  const h = hashSeed(serviceId);
  return 0.12 + Math.abs(Math.sin(h * 0.0017)) * 0.88;
}

/** Kiosk share of this service's volume (0–1) */
function kioskShareForService(channels: PayPointChannelSurface, serviceId: string): number {
  if (channels === "kiosk") return 1;
  if (channels === "webMobile") return 0;
  const h = hashSeed(`${serviceId}-ch`);
  return 0.38 + (Math.abs(h % 1000) / 1000) * 0.34;
}

export function partnerMatchesDashboardGroup(
  p: PayPointPartner,
  group: PayPointDashboardGroup
): boolean {
  if (group === "all") return true;
  if (group === "municipalities") return p.kind === "municipality";
  if (group === "mobile") return p.kind === "telco";
  if (group === "internet") return p.kind === "internet";
  if (group === "education") return p.kind === "education";
  if (group === "subscription") return p.kind === "subscription";
  return p.kind === "utility" || p.kind === "other";
}

export function payPointCyprusFilteredServices(group: PayPointDashboardGroup): PayPointService[] {
  const partnerIds = new Set(
    PAYPOINT_PARTNERS.filter((p) => partnerMatchesDashboardGroup(p, group)).map((p) => p.id)
  );
  return PAYPOINT_SERVICES.filter((s) => partnerIds.has(s.partnerId));
}

export type PayPointServiceMetric = {
  service: PayPointService;
  partner: PayPointPartner;
  amount: number;
  txCount: number;
  sharePct: number;
  kioskAmount: number;
  webMobileAmount: number;
};

export type PayPointChannelTotals = {
  total: number;
  kiosk: number;
  webMobile: number;
  kioskPct: number;
};

const GLOBAL_WEIGHT_SUM =
  PAYPOINT_SERVICES.reduce((a, s) => a + weightForService(s.id), 0) || 1;

/** Split PayPoint Cyprus month total across kiosk vs web/mobile using seeded service weights */
export function payPointCyprusChannelSplit(total?: number): PayPointChannelTotals {
  const t = total ?? payPointCyprusTotalMonthAmount();
  let kioskW = 0;
  let webW = 0;
  for (const s of PAYPOINT_SERVICES) {
    const w = weightForService(s.id);
    const ks = kioskShareForService(s.channels, s.id);
    kioskW += w * ks;
    webW += w * (1 - ks);
  }
  const sum = kioskW + webW || 1;
  const kiosk = Math.round((t * kioskW) / sum);
  const webMobile = t - kiosk;
  return {
    total: t,
    kiosk,
    webMobile,
    kioskPct: t > 0 ? (kiosk / t) * 100 : 0,
  };
}

export function payPointCyprusServiceRanking(
  limit: number,
  opts?: { group?: PayPointDashboardGroup; partnerId?: string }
): PayPointServiceMetric[] {
  const group = opts?.group ?? "all";
  let list = payPointCyprusFilteredServices(group);
  if (opts?.partnerId) {
    list = list.filter((s) => s.partnerId === opts.partnerId);
  }
  const totalMonth = payPointCyprusTotalMonthAmount();
  const filteredSumW =
    list.reduce((a, s) => a + weightForService(s.id), 0) || 1;
  const poolTotal =
    totalMonth * (filteredSumW / GLOBAL_WEIGHT_SUM);

  const rows: PayPointServiceMetric[] = list.map((service) => {
    const partner = PAYPOINT_PARTNERS.find((p) => p.id === service.partnerId)!;
    const w = weightForService(service.id);
    const amount = Math.round((poolTotal * w) / filteredSumW);
    const ticket =
      service.category === "mobileLoad"
        ? 280 + (Math.abs(hashSeed(service.id)) % 120)
        : service.category === "utility"
          ? 420 + (Math.abs(hashSeed(service.id)) % 200)
          : 180 + (Math.abs(hashSeed(service.id)) % 250);
    const txCount = Math.max(1, Math.round(amount / ticket));
    const ks = kioskShareForService(service.channels, service.id);
    return {
      service,
      partner,
      amount,
      txCount,
      sharePct: poolTotal > 0 ? (amount / poolTotal) * 100 : 0,
      kioskAmount: Math.round(amount * ks),
      webMobileAmount: Math.round(amount * (1 - ks)),
    };
  });

  rows.sort((a, b) => b.amount - a.amount);
  return rows.slice(0, limit);
}

export const PAYPOINT_MUNICIPALITY_PARTNERS = PAYPOINT_PARTNERS.filter(
  (p) => p.kind === "municipality"
);
