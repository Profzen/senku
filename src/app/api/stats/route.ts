import { calculateDashboardKpis } from "@/lib/calculations";
import { connectMongoDB } from "@/lib/mongodb";
import { buildTradeQuery } from "@/lib/trade-filters";
import { Account } from "@/models/Account";
import { Trade } from "@/models/Trade";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoDB();

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");

  const query = buildTradeQuery(searchParams, session.user.id);

  const trades = await Trade.find(query, { resultDollar: 1, rrRatio: 1, date: 1, strategy: 1, session: 1 }).sort({ date: 1 }).lean();

  const account = accountId ? await Account.findById(accountId, { initialBalance: 1 }).lean() : null;
  const initialBalance = account?.initialBalance ?? 0;

  const kpis = calculateDashboardKpis(trades, initialBalance);

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

  return NextResponse.json({
    data: {
      kpis,
      equityCurve,
      strategyBreakdown: Array.from(strategyMap.entries()).map(([name, value]) => ({ name, value })),
      sessionBreakdown: Array.from(sessionMap.entries()).map(([name, value]) => ({ name, value })),
    },
  });
}
