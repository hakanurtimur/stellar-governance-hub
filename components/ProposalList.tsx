import { BarChart3 } from "lucide-react";

import { leadingOption, proposalStatus, type ProposalState } from "../lib/governance";

type Props = {
  proposals: ProposalState[];
  selectedProposalId?: number;
  contractsConfigured: boolean;
  loading?: boolean;
  onSelect: (proposalId: number) => void;
};

const statusLabels = {
  open: "Open",
  closed: "Closed",
  ended: "Ended",
};

export function ProposalList({
  proposals,
  selectedProposalId,
  contractsConfigured,
  loading = false,
  onSelect,
}: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Proposals</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Governance proposals</h2>
        </div>
        <BarChart3 className="h-5 w-5 text-cyan-600" />
      </div>

      {!contractsConfigured ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Contracts are not deployed/configured yet.</p>
          <p className="mt-1">Add Governance and Reputation contract IDs to enable live proposal reads.</p>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">
            Loading proposals from Governance contract...
          </p>
        ) : proposals.length === 0 ? (
          <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">
            No proposals loaded yet.
          </p>
        ) : (
          proposals.map((proposal) => {
            const status = proposal.status ?? proposalStatus(proposal);
            const leader = leadingOption(proposal);
            const selected = selectedProposalId === proposal.id;

            return (
              <button
                className={`w-full rounded-lg border p-4 text-left transition ${
                  selected ? "border-cyan-500 bg-cyan-50" : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
                key={proposal.id}
                onClick={() => onSelect(proposal.id)}
                type="button"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    {proposal.isPreview ? (
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        Local preview data
                      </span>
                    ) : null}
                    <h3 className="mt-2 font-semibold text-slate-950">{proposal.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Leading option: {leader ? leader.label : "No votes yet"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                      {statusLabels[status]}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-1 text-slate-600">
                      {proposal.totalVotes} votes
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">Deadline: {proposal.deadline ?? "Not loaded"}</p>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
