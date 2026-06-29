import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ActivityFeed } from "./ActivityFeed";
import type { LastTransaction } from "../lib/transaction-state";

const lastTransaction: LastTransaction = {
  hash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  optionIndex: 1,
  optionLabel: "Payments",
  explorerUrl:
    "https://stellar.expert/explorer/testnet/tx/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  submittedAt: "2026-06-29T10:00:00.000Z",
};

describe("ActivityFeed", () => {
  it("shows the last successful browser transaction when contract events are empty", () => {
    const html = renderToStaticMarkup(
      <ActivityFeed activities={[]} lastTransaction={lastTransaction} syncing={false} />,
    );

    expect(html).toContain("Vote submitted");
    expect(html).toContain("Option: Payments");
    expect(html).toContain("aaaaaaaa...aaaaaaaa");
    expect(html).toContain("View on Explorer");
    expect(html).not.toContain("Vote activity will appear");
  });
});
