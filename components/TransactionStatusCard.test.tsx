import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TransactionStatusCard } from "./TransactionStatusCard";
import type { LastTransaction } from "../lib/transaction-state";

const transaction: LastTransaction = {
  hash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  optionIndex: 0,
  optionLabel: "Approve",
  proposalTitle: "Fund public goods round?",
  explorerUrl:
    "https://stellar.expert/explorer/testnet/tx/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  submittedAt: "2026-06-29T10:00:00.000Z",
};

describe("TransactionStatusCard", () => {
  it("keeps transaction hash visible in success state", () => {
    const html = renderToStaticMarkup(
      <TransactionStatusCard lastTransaction={transaction} status="success" />,
    );

    expect(html).toContain("success");
    expect(html).toContain(transaction.hash);
    expect(html).toContain("Fund public goods round?");
    expect(html).toContain("Approve");
    expect(html).toContain("Reputation point awarded.");
    expect(html).toContain("View on Stellar Expert");
  });
});
