import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ActivityFeed } from "./ActivityFeed";
import type { ActivityItem } from "../lib/activity";

const activity: ActivityItem = {
  id: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  title: "Vote submitted",
  proposalTitle: "Fund public goods round?",
  optionLabel: "Payments",
  txHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  explorerUrl:
    "https://stellar.expert/explorer/testnet/tx/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  timestamp: "2026-06-29T10:00:00.000Z",
  reputationAwarded: true,
};

describe("ActivityFeed", () => {
  it("shows the latest local successful vote", () => {
    const html = renderToStaticMarkup(<ActivityFeed activities={[activity]} syncing={false} />);

    expect(html).toContain("Vote submitted");
    expect(html).toContain("Fund public goods round?");
    expect(html).toContain("Option: Payments");
    expect(html).toContain("aaaaaaaa...aaaaaaaa");
    expect(html).toContain("View on Stellar Expert");
    expect(html).toContain("Reputation awarded");
  });

  it("shows an empty state before activity exists", () => {
    const html = renderToStaticMarkup(<ActivityFeed activities={[]} syncing={false} />);

    expect(html).toContain("No activity yet. Vote on a proposal to create the first event.");
  });
});
