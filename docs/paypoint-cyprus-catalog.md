# PayPoint Cyprus — product catalog (reference)

Condensed reference from PayPoint admin / operations. **Full authoritative service list lives in backend**; this file is for dashboard UX and TS seed alignment.

## Channels

| Channel        | Meaning                                      |
|----------------|----------------------------------------------|
| **Kiosk**      | Physical kiosk terminal (e.g. Vodafone Ki = VKi). |
| **Web/mobile** | PayPoint Web & PayPoint app (“PayPoint Web & Kiosk” in descriptions often means both kiosk + web surfaces). |

Reporting splits **Kiosk** vs **Web & mobile** where both exist for the same bill-type service.

## Partner tiers (examples)

### Municipalities (representative IDs from ops lists)

| Ref | Display name |
|-----|----------------|
| 1 | Gönyeli Alayköy Municipality |
| 4 | Dikmen Municipality |
| 5 | Gazimağusa Municipality |
| 7 | Laç Municipality |
| 8 | Lefke Municipality |
| 9 | Güzelyurt Municipality |
| 11 | Mehmetçik Büyükkonuk Municipality |
| 12 | Girne Municipality |
| 13 | Değirmenlik Akıncılar Municipality |
| 14 | İskele Municipality |
| 15 | Çatalköy Esentepe Municipality |
| 16 | Beyarmudu Municipality |
| 17 | Erenköy Municipality |
| 18 | Yeniboğaziçi Municipality |
| 26 | Geçitkale Serdarlı Municipality |
| 37 | Mesarya Municipality |

### Bill-payment stack under municipalities (taxonomy)

Typical **service categories** (names vary per provider API):

- Property / **Tax** (emlak)
- **Water** (su)
- **Baylan** / smart settlement layers
- **Smart card**
- **Traffic**
- **Business / other debts**
- **Online / API** variants (parallel rails)

Examples from admin exports: “Alaykoy Tax / Water”, “Magusa Tax / Water / Smart Card”, “Dikmen TAX online”, “Kibtek (PayPoint Web & Kiosks)”.

### Non-municipality highlights

| Ref | Name | Notes |
|-----|------|--------|
| 46 | Adakart | Card products |
| 23 | Lifecell | Internet / bundles (Turkcell vs PayPoint surfaces) |
| 43 | SurfaceNet | ISP |
| 44 | Near East University | Education cluster |
| 45 | University of Kyrenia | Education cluster |
| 24 | Chambers of Architects | Subscriptions / permits |
| 27 | SOS Çocuk Köyü | NGO |
| 28 | CWRI | NGO |
| 38 | Kıbrıs Türk Diyabet Derneği | NGO |
| 40 | KTEMO | Permits / subscriptions |
| 42 | Caesar Projects | Projects / utilities |

### Mobile operators (Turkcell / Vodafone patterns)

Admin distinguishes **kiosk-only** lines (e.g. “VKi”) vs **PayPoint Web & Kiosk** lines for prepaid/postpaid/internet. Dashboard treats these as channel-labelled bill-payment SKUs.

## Dashboard seed scope

The Next.js app uses a **curated subset** of partners + services in [`lib/data/paypoint-cyprus.ts`](../lib/data/paypoint-cyprus.ts) with **synthetic volumes** until API wiring. Expand seeds as needed; keep this doc updated for naming consistency.
