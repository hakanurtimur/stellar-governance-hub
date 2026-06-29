import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ActivityFeed } from "./ActivityFeed";
import type { LastTransaction } from "../lib/transaction-state";

const lastTransaction: LastTransaction = {
  hash: "0293b6348186a3d12b975402977673a6861b30a03cce8edac62f3c2a0d363223",
  optionIndex: 1,
  optionLabel: "Payments",
  explorerUrl:
    "https://stellar.expert/explorer/testnet/tx/0293b6348186a3d12b975402977673a6861b30a03cce8edac62f3c2a0d363223",
  submittedAt: "2026-06-29T10:00:00.000Z",
};

describe("ActivityFeed", () => {
  it("shows the last successful browser transaction when contract events are empty", () => {
    const html = renderToStaticMarkup(
      <ActivityFeed activities={[]} lastTransaction={lastTransaction} syncing={false} />,
    );

    expect(html).toContain("Vote submitted");
    expect(html).toContain("Option: Payments");
    expect(html).toContain("0293b634...0d363223");
    expect(html).toContain("View on Explorer");
    expect(html).not.toContain("Vote activity will appear");
  });
});
