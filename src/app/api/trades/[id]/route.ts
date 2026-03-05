import { connectMongoDB } from "@/lib/mongodb";
import { recalculateAccountBalance } from "@/lib/account-balance";
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

  const updated = await Trade.findOneAndUpdate({ _id: id, userId: session.user.id }, updates, { new: true }).lean();
  if (!updated) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  await recalculateAccountBalance(existingTrade.accountId, session.user.id);
  if (typeof updates.accountId === "string" && updates.accountId !== existingTrade.accountId) {
    await recalculateAccountBalance(updates.accountId, session.user.id);
  }

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
