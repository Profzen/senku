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
  };
}
