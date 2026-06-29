import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProposalCard } from "./ProposalCard";
import type { ProposalState } from "../lib/governance";

const proposal: ProposalState = {
  configured: true,
  id: 1,
  title: "Fund public goods round?",
  description: "Allocate treasury funds to developer tooling.",
  options: [
    { id: 0, label: "Approve", votes: 3 },
    { id: 1, label: "Reject", votes: 1 },
  ],
  totalVotes: 4,
  hasVoted: false,
  open: true,
};

describe("ProposalCard", () => {
  it("renders proposal details and disabled disconnected vote state", () => {
    const html = renderToStaticMarkup(
      <ProposalCard
        proposal={proposal}
        selectedOption={null}
        walletConnected={false}
        voting={false}
        onSelect={() => undefined}
        onVote={async () => undefined}
      />,
    );

    expect(html).toContain("Fund public goods round?");
    expect(html).toContain("Allocate treasury funds to developer tooling.");
    expect(html).toContain("Approve");
    expect(html).toContain("Connect wallet to vote");
  });

  it("shows already voted state", () => {
    const html = renderToStaticMarkup(
      <ProposalCard
        proposal={{ ...proposal, hasVoted: true }}
        selectedOption={0}
        walletConnected
        voting={false}
        onSelect={() => undefined}
        onVote={async () => undefined}
      />,
    );

    expect(html).toContain("Already voted");
    expect(html).toContain("This wallet has already voted");
  });
});
