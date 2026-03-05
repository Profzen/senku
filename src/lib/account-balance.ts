import { Account } from "@/models/Account";
import { Trade } from "@/models/Trade";

export async function recalculateAccountBalance(accountId: string, userId: string) {
  const account = await Account.findOne({ _id: accountId, userId }).lean();
  if (!account) {
    return;
  }

  const sums = await Trade.aggregate<{ total: number }>([
    {
      $match: {
        accountId,
        userId,
        status: "closed",
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: { $ifNull: ["$resultDollar", 0] } },
      },
    },
  ]);

  const totalResult = sums[0]?.total ?? 0;
  const currentBalance = account.initialBalance + totalResult;

  await Account.findByIdAndUpdate(accountId, { currentBalance });
}
