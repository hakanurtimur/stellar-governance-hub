import { CheckCircle2, Loader2, Vote, XCircle } from "lucide-react";

import type { TransactionStatus } from "../lib/format";
import type { ProposalState } from "../lib/governance";

type Props = {
  proposal?: ProposalState;
  selectedOption: number | null;
  walletConnected: boolean;
  contractsConfigured: boolean;
  transactionStatus: TransactionStatus;
  transactionError?: string;
  onVote: () => Promise<void>;
};

function voteButtonLabel({
  proposal,
  selectedOption,
  walletConnected,
  contractsConfigured,
  transactionStatus,
}: Omit<Props, "transactionError" | "onVote">): string {
  if (!walletConnected) {
    return "Connect wallet to vote";
  }
  if (!contractsConfigured) {
    return "Configure contracts to vote";
  }
  if (!proposal) {
    return "Select a proposal";
  }
  if (proposal.isPreview) {
    return "Select a live proposal";
  }
  if (!proposal.open || proposal.status === "closed" || proposal.status === "ended") {
    return "Proposal closed";
  }
  if (proposal.hasVoted) {
    return "Already voted";
  }
  if (selectedOption === null) {
    return "Select an option";
  }
  if (transactionStatus === "awaiting_signature") {
    return "Confirm in wallet";
  }
  if (transactionStatus === "preparing" || transactionStatus === "pending") {
    return "Submitting vote to Stellar Testnet";
  }
  if (transactionStatus === "success") {
    return "Vote recorded on-chain";
  }

  const option = proposal.options.find((item) => item.id === selectedOption);
  return `Vote for ${option?.label ?? "selected option"}`;
}

export function VotePanel(props: Props) {
  const { proposal, selectedOption, walletConnected, contractsConfigured, transactionStatus, transactionError, onVote } =
    props;
  const busy = transactionStatus === "preparing" || transactionStatus === "awaiting_signature" || transactionStatus === "pending";
  const success = transactionStatus === "success";
  const failed = transactionStatus === "failed";
  const disabled =
    !walletConnected ||
    !contractsConfigured ||
    !proposal ||
    proposal.isPreview ||
    selectedOption === null ||
    busy ||
    success ||
    proposal.hasVoted ||
    !proposal.open ||
    proposal.status === "closed" ||
    proposal.status === "ended";
  const Icon = success ? CheckCircle2 : failed ? XCircle : busy ? Loader2 : Vote;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vote panel</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Cast your vote</h2>
        </div>
        <Icon
          className={`h-5 w-5 ${busy ? "animate-spin text-cyan-600" : ""} ${
            success ? "text-emerald-600" : failed ? "text-rose-600" : "text-slate-500"
          }`}
        />
      </div>

      <button
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={disabled}
        onClick={onVote}
        type="button"
      >
        <Icon className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
        {voteButtonLabel(props)}
      </button>

      {failed && transactionError ? (
        <p className="mt-3 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{transactionError}</p>
      ) : null}
      {success ? (
        <p className="mt-3 rounded-md bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
          Vote recorded on-chain. Reputation point awarded.
        </p>
      ) : null}
      {!contractsConfigured ? (
        <p className="mt-3 text-sm text-slate-500">
          Add Governance and Reputation contract IDs before live Testnet voting.
        </p>
      ) : null}
    </section>
  );
}
