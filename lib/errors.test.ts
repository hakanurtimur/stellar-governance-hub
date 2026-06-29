import { describe, expect, it } from "vitest";

import { formatContractError } from "./errors";

describe("formatContractError", () => {
  it("maps contract and wallet failures to user-facing messages", () => {
    expect(formatContractError(new Error("AlreadyVoted"))).toBe(
      "This wallet has already voted on the selected proposal.",
    );
    expect(formatContractError(new Error("ProposalClosed"))).toBe(
      "This proposal is closed and no longer accepts votes.",
    );
    expect(formatContractError(new Error("User rejected the request"))).toBe(
      "Request rejected by user.",
    );
    expect(formatContractError(new Error("fetch failed"))).toBe(
      "Stellar RPC is unavailable. Please try again in a moment.",
    );
  });
});
