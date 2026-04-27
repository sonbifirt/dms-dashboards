import type { Merchant } from "./types";

const categoryMap: Record<string, string> = {
  COMMUNICATION: "Telecom",
  TICARET: "Retail",
  TEK: "Retail",
  TRADE: "Retail",
  KUYUMCULUK: "Jewelry",
  SIGORTA: "Insurance",
  TURIZM: "Travel",
  TURİZM: "Travel",
  HOTEL: "Hospitality",
  BILIŞIM: "Tech",
  BILISIM: "Tech",
  BILKAN: "Tech",
  MARKET: "Retail",
  GARDEN: "Hospitality",
  MEDIA: "Media",
  TRAVEL: "Travel",
  PAYMENT: "FinTech",
  CONSTRUCTION: "Construction",
  AGENCY: "Advertising",
  TATTOO: "Services",
  ELECTRONIC: "Retail",
  CARD: "FinTech",
  GROUP: "Retail",
  FOOD: "Food & Beverage",
  INS: "Insurance",
};

function classify(name: string): string {
  const upper = name.toUpperCase();
  for (const key of Object.keys(categoryMap)) {
    if (upper.includes(key)) return categoryMap[key];
  }
  if (upper.includes("HOTEL") || upper.includes("VILLA") || upper.includes("PLACE")) return "Hospitality";
  if (upper.includes("CAFE") || upper.includes("RESTAURANT") || upper.includes("KAHVE")) return "Food & Beverage";
  if (upper.includes("TECH") || upper.includes("SHOP")) return "Tech";
  return "Retail";
}

function seeded(i: number) {
  const x = Math.sin(i * 49.17 + 0.123) * 10000;
  return Math.abs(x - Math.floor(x));
}

const rawMerchants: Array<Omit<Merchant, "status" | "category" | "todayTurnover" | "monthTurnover" | "txCount">> = [
  { id: 1, name: "City Point Bilişim Services", code: "713565", website: "www.paypointcyprus.com", phone: "23370583", registered: "2020-03-05" },
  { id: 28, name: "Red Planet Travel LTD", code: "775223", website: "redplanetproperties.com", phone: "05488840010", registered: "2021-06-28" },
  { id: 111, name: "990 Media", code: "041385", website: "yok@yok.com", phone: "238318", registered: "2022-03-30" },
  { id: 55, name: "ACAR ACARBEY COMMUNICATION LTD", code: "355656", website: "www.yok.com", phone: "177993", registered: "2021-12-20" },
  { id: 143, name: "Adakart", code: "564052", website: "adakart.net", phone: "6", registered: "2025-10-01" },
  { id: 64, name: "AGALIBEYLI TRADING", code: "219131", website: "www.vip.com", phone: "4094919", registered: "2021-12-29" },
  { id: 58, name: "AHMET SÖNMEZ", code: "205636", website: "yok@gmail.com", phone: "11630", registered: "2021-12-27" },
  { id: 137, name: "AKYAYDOGAN TURIZM LTD", code: "115372", website: "www.zonehotel.net", phone: "17442", registered: "2022-07-18" },
  { id: 66, name: "ALI ULU", code: "236036", website: "yok@gmail.com", phone: "5330369942", registered: "2022-01-04" },
  { id: 92, name: "ALTINSAN KUYUMCULUK", code: "258809", website: "yo@yok.com", phone: "145236", registered: "2022-02-22" },
  { id: 107, name: "Altunç Sigorta", code: "121637", website: "aysmeltem293@gmail.com", phone: "119014050", registered: "2022-03-17" },
  { id: 59, name: "ALTUNÇ TURIZM", code: "621756", website: "yok@gmail.com", phone: "36584", registered: "2021-12-27" },
  { id: 26, name: "ANTEP ISI DOGAL URUNLERI", code: "521839", website: "www.antepisigurme.com", phone: "000000000000", registered: "2021-04-22" },
  { id: 61, name: "ARDA OZCENK TRADING LTD", code: "670183", website: "www.teknoworld.com", phone: "17151", registered: "2021-12-27" },
  { id: 15, name: "ASBIL BILISIM TEKNOLOJILERI LTD", code: "688142", website: "asbilbayi.com", phone: "27245", registered: "2020-10-26" },
  { id: 53, name: "AUGUST TIC LTD", code: "650958", website: "www.mediaking.com", phone: "856912", registered: "2021-12-17" },
  { id: 104, name: "Avcan Elektronik", code: "539715", website: "yok@yok.com", phone: "207770", registered: "2022-03-05" },
  { id: 46, name: "AYKIN ILETISIM KOLLEKTIF", code: "259833", website: "www.arasmax.com", phone: "2029", registered: "2021-12-13" },
  { id: 52, name: "AYKUT TATTOO", code: "907364", website: "yok@yok.com", phone: "54896", registered: "2021-12-17" },
  { id: 67, name: "Bahar & Yusuf Ajans LTD", code: "524523", website: "yusufbaharozbil@gmail.com", phone: "15243", registered: "2022-01-06" },
  { id: 135, name: "Baku Construction", code: "381988", website: "ngscoot.com", phone: "00228681", registered: "2022-07-04" },
  { id: 70, name: "Bakyön Turizm ve Seyahat", code: "781757", website: "yok@yok.com", phone: "2292", registered: "2022-01-10" },
  { id: 124, name: "Baris Gürsel", code: "789596", website: "baris.com", phone: "4787", registered: "2022-04-15" },
  { id: 118, name: "Bilkan Bilisim Teknoloji Ltd.", code: "628162", website: "info@bilkanltd.com", phone: "1221312", registered: "2022-04-07" },
  { id: 115, name: "Bilkan Bilisim Teknoloji ltd.", code: "632238", website: "info@bilkanltd.com", phone: "1321", registered: "2022-04-04" },
  { id: 96, name: "BIOMEDS TECHNOLOGY LTD", code: "640963", website: "biomedis.life", phone: "854632", registered: "2022-02-24" },
  { id: 33, name: "BIONX TRADING LTD", code: "069576", website: "bionx.shop", phone: "0692821", registered: "2021-11-22" },
  { id: 36, name: "BISHY PAYMENT SYSTEMS TRD LTD", code: "688230", website: "bish-y.com", phone: "252975", registered: "2021-11-26" },
  { id: 95, name: "Burhans Place Hotel", code: "187555", website: "yok@yok.com", phone: "2182636", registered: "2022-02-24" },
  { id: 73, name: "ÇANKAYA TICARET LTD", code: "092413", website: "www.kontoryukle.com", phone: "851369", registered: "2022-01-17" },
  { id: 50, name: "Car Park TRD LTD", code: "612598", website: "www.carpark.com", phone: "22092", registered: "2021-12-15" },
  { id: 8, name: "Card Plus", code: "456087", website: "card-plus.net", phone: "000000000000000", registered: "2020-06-08" },
  { id: 123, name: "Çarsimax", code: "524180", website: "www.carsimax.com", phone: "54432243", registered: "2022-04-15" },
  { id: 87, name: "Çayem Iletisim", code: "813616", website: "yok@yok.com", phone: "203026", registered: "2022-02-16" },
  { id: 23, name: "CDialogues PLC", code: "832776", website: "cdialogues.com", phone: "000000000000000", registered: "2021-03-10" },
  { id: 21, name: "Commercial Insurance LTD.", code: "467047", website: "www.commercialcyprus.com", phone: "741852", registered: "2021-02-01" },
  { id: 108, name: "CONVERGENCE IMPORT & EXPORT", code: "027360", website: "tekin_birinci@yahoo.com", phone: "234598", registered: "2022-03-21" },
  { id: 6, name: "Denizler Bilisim Hizmetleri", code: "245698", website: "www.denizlerbilisim.com", phone: "05338662279", registered: "2020-04-09" },
  { id: 60, name: "DIGIKEY COMPUTER LTD", code: "556911", website: "www.digikeycomputer.com", phone: "4616", registered: "2021-12-27" },
  { id: 86, name: "Easy Home Management", code: "485540", website: "yok@yok.com", phone: "5421598", registered: "2022-02-15" },
  { id: 65, name: "e-imzaKIBRIS", code: "433671", website: "www.e-imzakibris.com", phone: "292003196", registered: "2021-12-29" },
  { id: 89, name: "Elworks Technologies", code: "261865", website: "www.elworkc.com", phone: "192800", registered: "2022-02-16" },
  { id: 117, name: "EMINAGA GARDEN", code: "495037", website: "eminagagardenonline.com", phone: "122321", registered: "2022-04-05" },
  { id: 139, name: "Eniyitransfer.com", code: "371665", website: "eniyitransfer.com", phone: "223344687234", registered: "2023-01-06" },
  { id: 112, name: "Feriçok Ticaret", code: "465078", website: "yok@yok.com", phone: "123423", registered: "2022-03-30" },
  { id: 133, name: "Funda Garden", code: "217393", website: "fundagarden.com", phone: "484001921227625", registered: "2022-06-10" },
  { id: 77, name: "Garantili Arabam", code: "299784", website: "www.garantiliarabam.com", phone: "85961", registered: "2022-01-21" },
  { id: 103, name: "Gardens of Babel", code: "271440", website: "enginrodoplu@gmail.com", phone: "123132", registered: "2022-03-04" },
  { id: 24, name: "Gasson Mobilya ve Dekorasyon", code: "409388", website: "www.eleganmobilya.com", phone: "17117", registered: "2021-03-15" },
  { id: 127, name: "Gem Tours", code: "290087", website: "www.gemtours.com", phone: "672374367", registered: "2022-05-11" },
  { id: 144, name: "Kyrenia Harbour Co.", code: "881032", website: "kyreniaharbour.com", phone: "05488100100", registered: "2023-03-12" },
  { id: 145, name: "Mavi Marina", code: "773119", website: "mavimarina.com.tr", phone: "05488200200", registered: "2023-04-18" },
  { id: 146, name: "NorthStar Logistics", code: "661042", website: "northstar-log.com", phone: "05488300300", registered: "2023-05-20" },
  { id: 147, name: "Ege Telekom", code: "550218", website: "egetelekom.net", phone: "05488400400", registered: "2023-06-11" },
  { id: 148, name: "Cyprus Olive Oil", code: "449317", website: "cyprusoliveoil.com", phone: "05488500500", registered: "2023-07-22" },
  { id: 149, name: "Blue Lagoon Resort", code: "338216", website: "bluelagoonresort.com", phone: "05488600600", registered: "2023-09-03" },
  { id: 150, name: "Anadolu Shipping", code: "227315", website: "anadolushipping.com", phone: "05488700700", registered: "2023-10-15" },
  { id: 151, name: "Kibris Wine House", code: "116414", website: "kibriswine.com", phone: "05488800800", registered: "2024-01-08" },
  { id: 152, name: "Gold Horizon Jewelry", code: "005513", website: "goldhorizon.com", phone: "05488900900", registered: "2024-02-18" },
  { id: 153, name: "Tech Valley Cyprus", code: "994612", website: "techvalleycy.com", phone: "05489000000", registered: "2024-03-25" },
  { id: 154, name: "Famagusta Tours", code: "883711", website: "famagustatours.com", phone: "05489100100", registered: "2024-05-04" },
  { id: 155, name: "Karpaz Natural", code: "772810", website: "karpaznatural.com", phone: "05489200200", registered: "2024-06-12" },
  { id: 156, name: "Nicosia Markets", code: "661909", website: "nicosiamarkets.com", phone: "05489300300", registered: "2024-07-20" },
  { id: 157, name: "Mediterranean Cargo", code: "551008", website: "medcargo.com", phone: "05489400400", registered: "2024-08-15" },
  { id: 158, name: "Pafos Coffee Roasters", code: "440107", website: "pafoscoffee.com", phone: "05489500500", registered: "2024-09-25" },
  { id: 159, name: "Limassol Digital", code: "330206", website: "limassoldigital.com", phone: "05489600600", registered: "2024-11-08" },
  { id: 160, name: "Island Fuel Services", code: "220305", website: "islandfuel.com", phone: "05489700700", registered: "2025-01-14" },
  { id: 161, name: "Bosphorus Finance", code: "110404", website: "bosphorusfin.com", phone: "05489800800", registered: "2025-03-10" },
  { id: 162, name: "Cyprus Green Energy", code: "099503", website: "cyprusgreen.com", phone: "05489900900", registered: "2025-04-22" },
  { id: 163, name: "Aegean Express", code: "988602", website: "aegeanexpress.net", phone: "05490000000", registered: "2025-06-05" },
  { id: 164, name: "Delta Motors KKTC", code: "877701", website: "deltamotors.com.tr", phone: "05490100100", registered: "2025-07-18" },
  { id: 165, name: "Bellapais Events", code: "766800", website: "bellapaisevents.com", phone: "05490200200", registered: "2025-08-29" },
];

export const merchants: Merchant[] = rawMerchants.map((m, i) => {
  const r = seeded(m.id + i);
  const active = r > 0.12;
  const base = 8000 + Math.floor(seeded(m.id * 3) * 180000);
  const multiplier = Math.pow(seeded(m.id * 7) + 0.5, 3);
  const today = active ? Math.round(base * (0.4 + seeded(m.id * 11))) : 0;
  const month = active ? Math.round(base * 26 * multiplier) : 0;
  const tx = active ? Math.max(8, Math.round(base / 420)) : 0;
  return {
    ...m,
    status: active ? "Active" : "Inactive",
    category: classify(m.name),
    todayTurnover: today,
    monthTurnover: month,
    txCount: tx,
  };
});

export function getMerchant(id: number) {
  return merchants.find((m) => m.id === id);
}
