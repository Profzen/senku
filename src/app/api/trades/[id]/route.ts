import { connectMongoDB } from "@/lib/mongodb";
import { recalculateAccountBalance } from "@/lib/account-balance";
import { closeTradeSchema } from "@/lib/validators";
import { Trade } from "@/models/Trade";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoDB();
  const { id } = await params;

  const trade = await Trade.findOne({ _id: id, userId: session.user.id }).lean();
  if (!trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  return NextResponse.json({ data: trade });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoDB();
  const { id } = await params;
  const updates = await request.json();

  const existingTrade = await Trade.findOne({ _id: id, userId: session.user.id }).lean();
  if (!existingTrade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  let updatePayload: Record<string, unknown> = {};

  if (updates?.action === "close") {
    const parsedClose = closeTradeSchema.safeParse(updates);
    if (!parsedClose.success) {
      return NextResponse.json({ error: "Invalid close payload", details: parsedClose.error.flatten() }, { status: 400 });
    }

    if (existingTrade.status === "closed" || existingTrade.closedAt) {
      return NextResponse.json({ error: "Trade already closed" }, { status: 409 });
    }

    const { closeReason, resultDollar, observation } = parsedClose.data;
    const entryBalance = typeof existingTrade.entryBalance === "number" ? existingTrade.entryBalance : 0;
    const resultPercent = entryBalance > 0 ? (resultDollar / entryBalance) * 100 : 0;

    updatePayload = {
      status: "closed",
      closeReason,
      issue: closeReason,
      resultDollar,
      resultPercent,
      closedAt: new Date(),
      ...(observation ? { observation } : {}),
    };
  } else {
    updatePayload = {
      pair: updates?.pair,
      orderType: updates?.orderType,
      lot: updates?.lot,
      setup: updates?.setup,
      strategy: updates?.strategy,
      rpt: updates?.rpt,
      rrRatio: updates?.rrRatio,
      stopLoss: updates?.stopLoss,
      takeProfit: updates?.takeProfit,
      date: updates?.date ? new Date(updates.date) : undefined,
      observation: updates?.observation,
      psychology: updates?.psychology,
    };
  }

  const sanitizedPayload = Object.fromEntries(Object.entries(updatePayload).filter(([, value]) => value !== undefined));

  const updated = await Trade.findOneAndUpdate({ _id: id, userId: session.user.id }, sanitizedPayload, { new: true }).lean();
  if (!updated) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  await recalculateAccountBalance(existingTrade.accountId, session.user.id);

  return NextResponse.json({ data: updated });
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoDB();
  const { id } = await params;

  const existingTrade = await Trade.findOne({ _id: id, userId: session.user.id }).lean();
  if (!existingTrade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  const deleted = await Trade.findOneAndDelete({ _id: id, userId: session.user.id }).lean();
  if (!deleted) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  await recalculateAccountBalance(existingTrade.accountId, session.user.id);

  return NextResponse.json({ data: deleted });
}
