import { CheckCircle2, Vote } from "lucide-react";

import { toPercent } from "@/lib/format";
import type { PollState } from "@/lib/contract";

type Props = {
  poll: PollState;
  selectedOption: number | null;
  walletConnected: boolean;
  voting: boolean;
  onSelect: (optionId: number) => void;
  onVote: () => Promise<void>;
};

export function PollCard({
  poll,
  selectedOption,
  walletConnected,
  voting,
  onSelect,
  onVote,
}: Props) {
  const disabled = !walletConnected || selectedOption === null || voting || poll.hasVoted || !poll.configured;
  const selectedLabel = poll.options.find((option) => option.id === selectedOption)?.label;
  const voteButtonText = !walletConnected
    ? "Connect wallet to vote"
    : !poll.configured
      ? "Contract not configured"
      : poll.hasVoted
        ? "Already voted"
        : voting
          ? "Submitting vote..."
          : selectedLabel
            ? `Vote for ${selectedLabel}`
            : "Select an option to vote";
  const helperText = !walletConnected
    ? "Connect your wallet to submit an on-chain vote."
    : poll.hasVoted
      ? "This wallet has already voted. Results below are read from the contract."
      : selectedOption === null
        ? "Choose one option before submitting to Stellar Testnet."
        : "Your wallet will sign a real Soroban transaction for this vote.";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Live poll</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">{poll.question}</h1>
        </div>
        <div className="rounded-md bg-cyan-50 px-3 py-2 text-right">
          <p className="text-xs text-cyan-700">Total votes</p>
          <p className="font-mono text-lg font-semibold text-cyan-950">{poll.totalVotes}</p>
        </div>
      </div>

      {!poll.configured ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Add NEXT_PUBLIC_CONTRACT_ID to enable live testnet read/write calls.
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {poll.options.map((option) => {
          const percent = toPercent(option.votes, poll.totalVotes);
          const selected = selectedOption === option.id;

          return (
            <button
              className={`w-full rounded-lg border p-4 text-left transition ${
                selected ? "border-cyan-500 bg-cyan-50" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
              disabled={!walletConnected || voting || poll.hasVoted}
              key={option.id}
              onClick={() => onSelect(option.id)}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 font-medium text-slate-950">
                  {selected ? <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-600" /> : null}
                  <span className="truncate">{option.label}</span>
                </span>
                <span className="shrink-0 font-mono text-sm text-slate-600">{option.votes} votes</span>
              </div>
              {selected ? <p className="mt-2 text-xs font-medium text-cyan-700">Selected</p> : null}
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">{percent}%</p>
            </button>
          );
        })}
      </div>

      <button
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={disabled}
        onClick={onVote}
        type="button"
      >
        <Vote className="h-4 w-4" />
        {voteButtonText}
      </button>
      <p className="mt-3 text-center text-sm text-slate-500">{helperText}</p>
    </section>
  );
}
