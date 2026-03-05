import { z } from "zod";

export const createAccountSchema = z.object({
  userId: z.string().optional(),
  name: z.string().min(2),
  broker: z.string().min(2),
  type: z.enum(["personal", "prop", "challenge", "virtual"]),
  currency: z.string().default("USD"),
  initialBalance: z.number().nonnegative(),
  currentBalance: z.number().nonnegative().optional(),
  targetBalance: z.number().nonnegative().optional(),
  maxDailyDrawdown: z.number().nonnegative().optional(),
  maxTotalDrawdown: z.number().nonnegative().optional(),
  status: z.enum(["active", "inactive", "passed", "failed"]).default("active"),
  rules: z
    .object({
      maxLots: z.number().nonnegative().optional(),
      maxTradesPerDay: z.number().int().nonnegative().optional(),
      tradingDays: z.array(z.string()).optional(),
    })
    .optional(),
});

export const createTradeSchema = z.object({
  userId: z.string().optional(),
  accountId: z.string().min(1),
  date: z.string().datetime(),
  pair: z.string().min(2),
  orderType: z.enum(["buy", "sell"]),
  lot: z.number().positive(),
  setup: z.string().min(2),
  strategy: z.string().min(2),
  rpt: z.number().nonnegative(),
  rrRatio: z.number().nonnegative(),
  stopLoss: z.number().optional(),
  takeProfit: z.number().optional(),
  screenshots: z.array(z.string().url()).optional(),
  observation: z.string().optional(),
  psychology: z
    .object({
      emotionalState: z.number().min(1).max(10).optional(),
      confidence: z.enum(["low", "medium", "high"]).optional(),
      planFollowed: z.enum(["yes", "no", "partial"]).optional(),
      error: z.string().optional(),
      lesson: z.string().optional(),
      mood: z.string().optional(),
    })
    .optional(),
});

export const closeTradeSchema = z.object({
  closeReason: z.enum(["tp", "sl", "retractation"]),
  resultDollar: z.number(),
  observation: z.string().trim().min(2),
});
