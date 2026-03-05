import mongoose, { Schema, type InferSchemaType } from "mongoose";

const TradeSchema = new Schema(
  {
    accountId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    pair: { type: String, required: true },
    orderType: { type: String, enum: ["buy", "sell"], required: true },
    lot: { type: Number, required: true },
    session: { type: String, enum: ["asia", "london", "new-york", "overlap"], required: true },
    setup: { type: String, required: true },
    strategy: { type: String, required: true },
    rpt: { type: Number, required: true },
    rrRatio: { type: Number, required: true },
    issue: { type: String, enum: ["tp", "sl", "be", "partial", "manual"], required: true },
    resultPercent: { type: Number, required: true },
    resultDollar: { type: Number, required: true },
    screenshots: [{ type: String }],
    psychology: {
      emotionalState: { type: Number, min: 1, max: 10 },
      confidence: { type: String, enum: ["low", "medium", "high"] },
      planFollowed: { type: String, enum: ["yes", "no", "partial"] },
      error: { type: String },
      lesson: { type: String },
      mood: { type: String },
    },
    observation: { type: String },
    tags: [{ type: String }],
  },
  { timestamps: true },
);

TradeSchema.index({ accountId: 1, date: -1 });
TradeSchema.index({ userId: 1, date: -1 });
TradeSchema.index({ accountId: 1, pair: 1 });
TradeSchema.index({ accountId: 1, strategy: 1 });
TradeSchema.index({ accountId: 1, resultDollar: 1 });

export type TradeDocument = InferSchemaType<typeof TradeSchema>;

export const Trade = mongoose.models.Trade || mongoose.model("Trade", TradeSchema);
