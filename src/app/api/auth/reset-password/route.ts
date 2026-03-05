import { connectMongoDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  await connectMongoDB();

  const body = await request.json();
  const parsed = resetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");

  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  user.passwordHash = await hash(parsed.data.password, 12);
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();

  return NextResponse.json({ data: { updated: true } });
}
