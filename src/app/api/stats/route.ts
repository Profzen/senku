import { calculateDashboardKpis, calculateDisciplineScore } from "@/lib/calculations";
import { connectMongoDB } from "@/lib/mongodb";
import { buildTradeQuery } from "@/lib/trade-filters";
import { Account } from "@/models/Account";
import { Trade } from "@/models/Trade";
import { User } from "@/models/User";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoDB();

  const user = await User.findById(session.user.id, { "preferences.notifications": 1 }).lean();

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");

  const query = buildTradeQuery(searchParams, session.user.id);

  const trades = await Trade.find(query, { resultDollar: 1, rrRatio: 1, date: 1, strategy: 1, session: 1, psychology: 1 }).sort({ date: 1 }).lean();

  const account = accountId
    ? await Account.findOne(
        { _id: accountId, userId: session.user.id },
        { name: 1, currency: 1, initialBalance: 1, targetBalance: 1, maxDailyDrawdown: 1, maxTotalDrawdown: 1, type: 1 },
      ).lean()
    : null;
  const initialBalance = account?.initialBalance ?? 0;

  const kpis = calculateDashboardKpis(trades, initialBalance);
  const discipline = calculateDisciplineScore(trades);
  kpis.disciplineScore = discipline.score;

  const equityCurve = trades.reduce<{ date: string; balance: number }[]>((acc, trade) => {
    const previous = acc.length ? acc[acc.length - 1].balance : initialBalance;
    acc.push({
      date: new Date(trade.date).toISOString().slice(0, 10),
      balance: previous + trade.resultDollar,
    });
    return acc;
  }, []);

  const strategyMap = new Map<string, number>();
  const sessionMap = new Map<string, number>();

  for (const trade of trades) {
    strategyMap.set(trade.strategy, (strategyMap.get(trade.strategy) ?? 0) + trade.resultDollar);
    sessionMap.set(trade.session, (sessionMap.get(trade.session) ?? 0) + trade.resultDollar);
  }

  let propFirm: {
    enabled: boolean;
    dailyLossPercent: number;
    totalDrawdownPercent: number;
    maxDailyDrawdown: number;
    maxTotalDrawdown: number;
    dailyAlert: boolean;
    totalAlert: boolean;
    objectiveProgress: number;
    objectiveRemaining: number;
    currentBalance: number;
    targetBalance: number;
    accountName: string;
    currency: string;
  } | null = null;

  if (account && accountId) {
    const accountTrades = await Trade.find(
      { userId: session.user.id, accountId },
      { date: 1, resultDollar: 1 },
    )
      .sort({ date: 1 })
      .lean();

    let running = account.initialBalance;
    let peak = account.initialBalance;

    for (const trade of accountTrades) {
      running += trade.resultDollar;
      if (running > peak) {
        peak = running;
      }
    }

    const currentBalance = running;
    const totalDrawdownPercent = peak > 0 ? ((peak - currentBalance) / peak) * 100 : 0;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayPnl = accountTrades
      .filter((trade) => new Date(trade.date) >= startOfDay)
      .reduce((sum, trade) => sum + trade.resultDollar, 0);

    const dailyLossPercent = todayPnl < 0 && account.initialBalance > 0 ? (Math.abs(todayPnl) / account.initialBalance) * 100 : 0;

    const targetBalance = account.targetBalance ?? account.initialBalance;
    const objectiveDenominator = targetBalance - account.initialBalance;
    const objectiveProgress =
      objectiveDenominator > 0
        ? Math.max(0, Math.min(100, ((currentBalance - account.initialBalance) / objectiveDenominator) * 100))
        : 100;
    const objectiveRemaining = Math.max(0, targetBalance - currentBalance);

    const maxDailyDrawdown = account.maxDailyDrawdown ?? 0;
    const maxTotalDrawdown = account.maxTotalDrawdown ?? 0;

    propFirm = {
      enabled: account.type === "prop" || account.type === "challenge",
      dailyLossPercent,
      totalDrawdownPercent,
      maxDailyDrawdown,
      maxTotalDrawdown,
      dailyAlert: maxDailyDrawdown > 0 ? dailyLossPercent >= maxDailyDrawdown * 0.8 : false,
      totalAlert: maxTotalDrawdown > 0 ? totalDrawdownPercent >= maxTotalDrawdown * 0.8 : false,
      objectiveProgress,
      objectiveRemaining,
      currentBalance,
      targetBalance,
      accountName: account.name,
      currency: account.currency ?? "USD",
    };
  }

  return NextResponse.json({
    data: {
      kpis,
      discipline,
      preferences: {
        notifications: user?.preferences?.notifications ?? true,
      },
      propFirm,
      equityCurve,
      strategyBreakdown: Array.from(strategyMap.entries()).map(([name, value]) => ({ name, value })),
      sessionBreakdown: Array.from(sessionMap.entries()).map(([name, value]) => ({ name, value })),
    },
  });
}
