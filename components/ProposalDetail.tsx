import { toPercent } from "../lib/format";
import { proposalStatus, type ProposalState } from "../lib/governance";

type Props = {
  proposal?: ProposalState;
  selectedOption: number | null;
  walletConnected: boolean;
  onSelectOption: (optionId: number) => void;
};

export function ProposalDetail({ proposal, selectedOption, walletConnected, onSelectOption }: Props) {
  if (!proposal) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Select a proposal to inspect vote options.</p>
      </section>
    );
  }

  const status = proposal.status ?? proposalStatus(proposal);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Proposal #{proposal.id}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{proposal.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{proposal.description}</p>
        </div>
        <span className="w-fit rounded-md bg-slate-100 px-3 py-2 text-sm font-medium capitalize text-slate-700">
          {status}
        </span>
      </div>

      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-slate-500">Total votes</p>
          <p className="mt-1 font-mono text-lg font-semibold">{proposal.totalVotes}</p>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-slate-500">Deadline</p>
          <p className="mt-1 font-medium">{proposal.deadline ?? "Not loaded"}</p>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-slate-500">Wallet state</p>
          <p className="mt-1 font-medium">{proposal.hasVoted ? "Already voted" : "Not voted"}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {proposal.options.map((option) => {
          const percent = toPercent(option.votes, proposal.totalVotes);

          return (
            <button
              className={`w-full rounded-lg border p-4 text-left transition ${
                selectedOption === option.id
                  ? "border-cyan-500 bg-cyan-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
              disabled={!walletConnected || proposal.hasVoted || !proposal.open || proposal.isPreview}
              key={option.id}
              onClick={() => onSelectOption(option.id)}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-950">{option.label}</p>
                <p className="font-mono text-sm text-slate-600">{option.votes} votes</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">{percent}%</p>
              {selectedOption === option.id ? (
                <p className="mt-2 text-xs font-medium text-cyan-700">Selected</p>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
