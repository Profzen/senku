import { authOptions } from "@/lib/auth";
import { connectMongoDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const preferencesSchema = z.object({
  theme: z.enum(["dark", "light"]).optional(),
  dateFormat: z.enum(["dd/MM/yyyy", "MM/dd/yyyy"]).optional(),
  notifications: z.boolean().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoDB();

  const user = await User.findById(session.user.id, {
    preferences: 1,
    timezone: 1,
    currency: 1,
  }).lean();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      theme: user.preferences?.theme ?? "dark",
      dateFormat: user.preferences?.dateFormat ?? "dd/MM/yyyy",
      notifications: user.preferences?.notifications ?? true,
      timezone: user.timezone ?? "UTC",
      currency: user.currency ?? "USD",
    },
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoDB();

  const body = await request.json();
  const parsed = preferencesSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  const update: Record<string, unknown> = {};
  if (payload.theme) update["preferences.theme"] = payload.theme;
  if (payload.dateFormat) update["preferences.dateFormat"] = payload.dateFormat;
  if (typeof payload.notifications === "boolean") update["preferences.notifications"] = payload.notifications;
  if (payload.timezone) update.timezone = payload.timezone;
  if (payload.currency) update.currency = payload.currency;

  const user = await User.findByIdAndUpdate(session.user.id, { $set: update }, { new: true, projection: { preferences: 1, timezone: 1, currency: 1 } }).lean();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      theme: user.preferences?.theme ?? "dark",
      dateFormat: user.preferences?.dateFormat ?? "dd/MM/yyyy",
      notifications: user.preferences?.notifications ?? true,
      timezone: user.timezone ?? "UTC",
      currency: user.currency ?? "USD",
    },
  });
}
