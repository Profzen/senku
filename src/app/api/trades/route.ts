import { connectMongoDB } from "@/lib/mongodb";
import { createTradeSchema } from "@/lib/validators";
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
  const query = buildTradeQuery(searchParams, session.user.id);
  const limit = Number(searchParams.get("limit") ?? "100");

  const trades = await Trade.find(query).sort({ date: -1 }).limit(Math.min(Math.max(limit, 1), 500)).lean();
  return NextResponse.json({ data: trades });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoDB();

  const body = await request.json();
  const parsed = createTradeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid trade payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  const account = await Account.findOne({ _id: payload.accountId, userId: session.user.id }).lean();
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const trade = await Trade.create({
    accountId: payload.accountId,
    date: new Date(payload.date),
    pair: payload.pair,
    orderType: payload.orderType,
    lot: payload.lot,
    setup: payload.setup,
    strategy: payload.strategy,
    rpt: payload.rpt,
    rrRatio: payload.rrRatio,
    stopLoss: payload.stopLoss,
    takeProfit: payload.takeProfit,
    status: "open",
    resultDollar: null,
    resultPercent: null,
    closeReason: null,
    closedAt: null,
    entryBalance: account.currentBalance,
    observation: payload.observation,
    screenshots: payload.screenshots,
    psychology: payload.psychology,
    userId: session.user.id,
  });

  return NextResponse.json({ data: trade }, { status: 201 });
}
