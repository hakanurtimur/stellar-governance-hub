import { describe, expect, it } from "vitest";

import { voteOnProposal } from "./governance";

describe("voteOnProposal", () => {
  it("does not run a live vote when contract ids are missing", async () => {
    await expect(
      voteOnProposal({
        walletAddress: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
        proposalId: 1,
        optionIndex: 0,
      }),
    ).rejects.toThrow("Missing contract env");
  });
});
