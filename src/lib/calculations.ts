import { DashboardKpis } from "@/types/domain";

type TradeStatsInput = {
  resultDollar: number;
  rrRatio: number;
};

export function calculateDashboardKpis(trades: TradeStatsInput[], initialBalance = 0): DashboardKpis {
  const tradeCount = trades.length;
  const totalProfit = trades.filter((trade) => trade.resultDollar > 0).reduce((sum, trade) => sum + trade.resultDollar, 0);
  const totalLossAbs = Math.abs(
    trades.filter((trade) => trade.resultDollar < 0).reduce((sum, trade) => sum + trade.resultDollar, 0),
  );

  const netPnl = totalProfit - totalLossAbs;
  const winCount = trades.filter((trade) => trade.resultDollar > 0).length;
  const winRate = tradeCount ? (winCount / tradeCount) * 100 : 0;
  const avgRR = tradeCount ? trades.reduce((sum, trade) => sum + trade.rrRatio, 0) / tradeCount : 0;
  const profitFactor = totalLossAbs ? totalProfit / totalLossAbs : totalProfit > 0 ? Number.POSITIVE_INFINITY : 0;

  let peak = initialBalance;
  let running = initialBalance;
  let maxDrawdown = 0;

  for (const trade of trades) {
    running += trade.resultDollar;
    if (running > peak) {
      peak = running;
    }

    if (peak > 0) {
      const drawdown = ((peak - running) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
  }

  return {
    currentBalance: initialBalance + netPnl,
    totalProfit,
    totalLoss: -totalLossAbs,
    netPnl,
    winRate,
    avgRR,
    profitFactor: Number.isFinite(profitFactor) ? profitFactor : 0,
    currentDrawdown: maxDrawdown,
    tradeCount,
    disciplineScore: 0,
  };
}

type PsychologyInput = {
  psychology?: {
    emotionalState?: number;
    confidence?: "low" | "medium" | "high";
    planFollowed?: "yes" | "no" | "partial";
    error?: string;
  };
};

export function calculateDisciplineScore(trades: PsychologyInput[]) {
  const psychologyTrades = trades.filter((trade) => trade.psychology);

  if (!psychologyTrades.length) {
    return {
      score: 0,
      planFollowRate: 0,
      emotionalControl: 0,
      revengeCount: 0,
      fomoCount: 0,
      entries: 0,
    };
  }

  let totalScore = 0;
  let totalPlan = 0;
  let totalEmotion = 0;
  let revengeCount = 0;
  let fomoCount = 0;

  for (const trade of psychologyTrades) {
    const planFollowed = trade.psychology?.planFollowed;
    const emotionalState = trade.psychology?.emotionalState;
    const confidence = trade.psychology?.confidence;
    const error = (trade.psychology?.error ?? "").toLowerCase();

    const planScore = planFollowed === "yes" ? 100 : planFollowed === "partial" ? 60 : planFollowed === "no" ? 20 : 50;
    const emotionScore = typeof emotionalState === "number" ? Math.max(0, Math.min(100, 100 - ((emotionalState - 1) * 100) / 9)) : 50;
    const confidenceScore = confidence === "high" ? 100 : confidence === "medium" ? 70 : confidence === "low" ? 40 : 60;

    if (error.includes("revenge")) revengeCount += 1;
    if (error.includes("fomo")) fomoCount += 1;

    const penalty = (error.includes("revenge") ? 20 : 0) + (error.includes("fomo") ? 10 : 0);

    const tradeScore = Math.max(0, Math.min(100, planScore * 0.5 + emotionScore * 0.3 + confidenceScore * 0.2 - penalty));

    totalScore += tradeScore;
    totalPlan += planScore;
    totalEmotion += emotionScore;
  }

  const entries = psychologyTrades.length;

  return {
    score: totalScore / entries,
    planFollowRate: totalPlan / entries,
    emotionalControl: totalEmotion / entries,
    revengeCount,
    fomoCount,
    entries,
  };
}
