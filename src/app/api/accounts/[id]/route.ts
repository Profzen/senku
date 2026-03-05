import { connectMongoDB } from "@/lib/mongodb";
import { Account } from "@/models/Account";
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

  const account = await Account.findOne({ _id: id, userId: session.user.id }).lean();
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  return NextResponse.json({ data: account });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoDB();
  const { id } = await params;
  const updates = await request.json();

  const updated = await Account.findOneAndUpdate({ _id: id, userId: session.user.id }, updates, { new: true }).lean();
  if (!updated) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
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

  const deleted = await Account.findOneAndDelete({ _id: id, userId: session.user.id }).lean();
  if (!deleted) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  await Trade.deleteMany({ accountId: id, userId: session.user.id });

  return NextResponse.json({ data: deleted });
}
