import { connectMongoDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

const forgotSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  await connectMongoDB();

  const body = await request.json();
  const parsed = forgotSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await User.findOne({ email });

  if (!user) {
    return NextResponse.json({ data: { accepted: true } });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.resetPasswordTokenHash = tokenHash;
  user.resetPasswordExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
  await user.save();

  return NextResponse.json({
    data: {
      accepted: true,
      resetToken: process.env.NODE_ENV === "development" ? rawToken : undefined,
    },
  });
}
