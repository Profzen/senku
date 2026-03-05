import { connectMongoDB } from "@/lib/mongodb";
import { Account } from "@/models/Account";
import { Trade } from "@/models/Trade";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoDB();

  const userId = session.user.id;

  const existingAccount = await Account.findOne({ userId }).lean();

  const account =
    existingAccount ??
    (await Account.create({
      userId,
      name: "FTMO Challenge",
      broker: "FTMO",
      type: "challenge",
      currency: "USD",
      initialBalance: 10000,
      currentBalance: 10000,
      targetBalance: 11000,
      maxDailyDrawdown: 5,
      maxTotalDrawdown: 10,
      status: "active",
      rules: {
        maxLots: 1,
        maxTradesPerDay: 5,
        tradingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      },
    }));

  const existingTrades = await Trade.countDocuments({ userId });
  if (existingTrades > 0) {
    return NextResponse.json({ data: { accountId: account._id, insertedTrades: 0 }, message: "Seed already exists" });
  }

  const samples = [
    { date: "2026-03-01T09:00:00.000Z", pair: "EURUSD", orderType: "buy", lot: 0.1, setup: "Breakout", strategy: "Breakout", session: "london", rpt: 1, rrRatio: 2, issue: "tp", resultDollar: 80, resultPercent: 0.8 },
    { date: "2026-03-02T10:20:00.000Z", pair: "GBPUSD", orderType: "sell", lot: 0.1, setup: "Liquidity", strategy: "Liquidity", session: "london", rpt: 1, rrRatio: 1.5, issue: "sl", resultDollar: -50, resultPercent: -0.5 },
    { date: "2026-03-03T14:30:00.000Z", pair: "XAUUSD", orderType: "buy", lot: 0.1, setup: "Trend Follow", strategy: "Trend Follow", session: "new-york", rpt: 1, rrRatio: 3, issue: "tp", resultDollar: 120, resultPercent: 1.2 },
    { date: "2026-03-04T08:30:00.000Z", pair: "NAS100", orderType: "buy", lot: 0.1, setup: "Reversal", strategy: "Reversal", session: "london", rpt: 1, rrRatio: 1.2, issue: "be", resultDollar: 0, resultPercent: 0 },
  ] as const;

  await Trade.insertMany(
    samples.map((trade) => ({
      ...trade,
      userId,
      accountId: String(account._id),
      date: new Date(trade.date),
    })),
  );

  const finalBalance = samples.reduce((sum, trade) => sum + trade.resultDollar, 10000);
  await Account.findByIdAndUpdate(account._id, { currentBalance: finalBalance });

  return NextResponse.json({ data: { accountId: account._id, insertedTrades: samples.length } }, { status: 201 });
}
