import { connectMongoDB } from "@/lib/mongodb";
import { createAccountSchema } from "@/lib/validators";
import { Account } from "@/models/Account";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoDB();

  const query = { userId: session.user.id };
  const accounts = await Account.find(query).sort({ createdAt: -1 }).lean();

  return NextResponse.json({ data: accounts });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoDB();

  const body = await request.json();
  const parsed = createAccountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid account payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const account = await Account.create({
    ...payload,
    userId: session.user.id,
    currentBalance: payload.currentBalance ?? payload.initialBalance,
  });

  return NextResponse.json({ data: account }, { status: 201 });
}
