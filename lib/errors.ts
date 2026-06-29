import { formatErrorMessage } from "./format";

export function formatContractError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);
  const message = raw.toLowerCase();

  if (message.includes("alreadyvoted") || message.includes("already voted")) {
    return "This wallet has already voted on the selected proposal.";
  }

  if (message.includes("proposalclosed") || message.includes("proposal closed")) {
    return "This proposal is closed and no longer accepts votes.";
  }

  if (message.includes("votingdeadlinepassed") || message.includes("deadline")) {
    return "This proposal has ended and no longer accepts votes.";
  }

  if (message.includes("invalidoption") || message.includes("invalid option")) {
    return "Select a valid proposal option before voting.";
  }

  if (message.includes("missing contract env")) {
    return "Missing contract env. Configure Governance and Reputation contract IDs before voting.";
  }

  return formatErrorMessage(error);
}
