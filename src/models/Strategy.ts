import mongoose, { Schema, type InferSchemaType } from "mongoose";

const StrategySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    rules: [{ type: String }],
    pairs: [{ type: String }],
    timeframes: [{ type: String }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

StrategySchema.index({ userId: 1, name: 1 }, { unique: true });

export type StrategyDocument = InferSchemaType<typeof StrategySchema>;

export const Strategy = mongoose.models.Strategy || mongoose.model("Strategy", StrategySchema);
