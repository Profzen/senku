export type AccountType = "personal" | "prop" | "challenge" | "virtual";
export type AccountStatus = "active" | "inactive" | "passed" | "failed";

export type OrderType = "buy" | "sell";
export type TradingSession = "asia" | "london" | "new-york" | "overlap";
export type TradeIssue = "tp" | "sl" | "be" | "partial" | "manual";

export interface UserPreferences {
  theme: "dark" | "light";
  dateFormat: "dd/MM/yyyy" | "MM/dd/yyyy";
  notifications: boolean;
}

export interface AccountRules {
  maxLots?: number;
  maxTradesPerDay?: number;
  tradingDays?: string[];
}

export interface PsychologyEntry {
  emotionalState?: number;
  confidence?: "low" | "medium" | "high";
  planFollowed?: "yes" | "no" | "partial";
  error?: string;
  lesson?: string;
  mood?: string;
}

export interface DashboardKpis {
  currentBalance: number;
  totalProfit: number;
  totalLoss: number;
  netPnl: number;
  winRate: number;
  avgRR: number;
  profitFactor: number;
  currentDrawdown: number;
  tradeCount: number;
}
