export type TradeResultFilter = "winner" | "loser" | "breakeven";

export function buildTradeQuery(searchParams: URLSearchParams, userId: string) {
  const query: Record<string, unknown> = { userId };

  const accountId = searchParams.get("accountId");
  const pair = searchParams.get("pair");
  const strategy = searchParams.get("strategy");
  const session = searchParams.get("session");
  const issue = searchParams.get("issue");
  const orderType = searchParams.get("orderType");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const result = searchParams.get("result") as TradeResultFilter | null;

  if (accountId) query.accountId = accountId;
  if (pair) query.pair = pair;
  if (strategy) query.strategy = strategy;
  if (session) query.session = session;
  if (issue) query.issue = issue;
  if (orderType) query.orderType = orderType;

  if (from || to) {
    query.date = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {}),
    };
  }

  if (result === "winner") {
    query.resultDollar = { $gt: 0 };
  } else if (result === "loser") {
    query.resultDollar = { $lt: 0 };
  } else if (result === "breakeven") {
    query.resultDollar = 0;
  }

  return query;
}
