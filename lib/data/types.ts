export type DealerStatus = "Active" | "Inactive";
export type WorkMode = "Production" | "Test";

export interface Dealer {
  id: number;
  name: string;
  location: string;
  email: string;
  phone: string;
  balance: number;
  currency: "TRY";
  status: DealerStatus;
  workMode: WorkMode;
}

export type KioskStatus = "OK" | "Paper Warning" | "Error" | "Disabled" | "Not Found";

export interface Kiosk {
  id: string;
  name: string;
  city: string;
  status: KioskStatus;
  statusDetail: string;
  monitors: number;
  paperStatus: "OK" | "Near end" | "Paper absent";
  bankNoteStatus: "OK" | "Error" | "Not used";
  lastActivity: string;
  cashCount: number;
  cashAmount: number;
  cardCount: number;
  cardAmount: number;
  totalCount: number;
  totalAmount: number;
  dealerId?: number;
}

export type MerchantStatus = "Active" | "Inactive";

export interface Merchant {
  id: number;
  name: string;
  code: string;
  website: string;
  phone: string;
  registered: string;
  status: MerchantStatus;
  category: string;
  todayTurnover: number;
  monthTurnover: number;
  txCount: number;
}

export interface LiveActivity {
  id: string;
  timestamp: string;
  kind: "Cash" | "Card";
  entity: string;
  city: string;
  amount: number;
}
