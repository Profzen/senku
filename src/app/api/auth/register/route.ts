import { connectMongoDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  await connectMongoDB();

  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const exists = await User.findOne({ email: normalizedEmail }).lean();
  if (exists) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);

  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    timezone: "UTC",
    currency: "USD",
    preferences: {
      theme: "dark",
      dateFormat: "dd/MM/yyyy",
      notifications: true,
    },
  });

  return NextResponse.json(
    {
      data: {
        id: String(user._id),
        name: user.name,
        email: user.email,
      },
    },
    { status: 201 },
  );
}
