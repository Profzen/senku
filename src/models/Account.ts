import mongoose, { Schema, type InferSchemaType } from "mongoose";

const AccountSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    broker: { type: String, required: true, trim: true },
    type: { type: String, enum: ["personal", "prop", "challenge", "virtual"], required: true },
    currency: { type: String, default: "USD" },
    initialBalance: { type: Number, required: true },
    currentBalance: { type: Number, required: true },
    targetBalance: { type: Number },
    maxDailyDrawdown: { type: Number },
    maxTotalDrawdown: { type: Number },
    status: { type: String, enum: ["active", "inactive", "passed", "failed"], default: "active" },
    rules: {
      maxLots: { type: Number },
      maxTradesPerDay: { type: Number },
      tradingDays: [{ type: String }],
    },
  },
  { timestamps: true },
);

AccountSchema.index({ userId: 1, createdAt: -1 });

export type AccountDocument = InferSchemaType<typeof AccountSchema>;

export const Account = mongoose.models.Account || mongoose.model("Account", AccountSchema);
