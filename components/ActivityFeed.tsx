import { ExternalLink, RadioTower } from "lucide-react";

import type { VoteActivity } from "../lib/contract";
import { shortenAddress } from "../lib/format";
import type { LastTransaction } from "../lib/transaction-state";

type Props = {
  activities: VoteActivity[];
  lastTransaction?: LastTransaction;
  syncing: boolean;
};

export function ActivityFeed({ activities, lastTransaction, syncing }: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Activity feed</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Latest vote events</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          <RadioTower className={`h-4 w-4 ${syncing ? "animate-pulse" : ""}`} />
          {syncing ? "Live syncing" : "Sync idle"}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {activities.length === 0 ? (
          lastTransaction ? (
            <div className="rounded-md border border-cyan-100 bg-cyan-50 p-4 text-sm">
              <p className="font-medium text-cyan-950">Vote submitted</p>
              <p className="mt-1 text-cyan-800">Option: {lastTransaction.optionLabel}</p>
              <p className="mt-3 font-mono text-xs text-cyan-900">
                Tx: {shortenAddress(lastTransaction.hash, 8, 8)}
              </p>
              <a
                className="mt-3 inline-flex items-center gap-2 font-medium text-cyan-800 hover:text-cyan-950"
                href={lastTransaction.explorerUrl}
                rel="noreferrer"
                target="_blank"
              >
                View on Explorer <ExternalLink className="h-4 w-4" />
              </a>
              <time className="mt-2 block text-xs text-cyan-700">
                {new Date(lastTransaction.submittedAt).toLocaleString()}
              </time>
            </div>
          ) : (
            <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">
              Vote activity will appear after a transaction is submitted or synced from
              contract events.
            </p>
          )
        ) : (
          activities.map((activity) => (
            <div className="rounded-md border border-slate-100 bg-slate-50 p-3" key={activity.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-950">{shortenAddress(activity.voter)} voted</p>
                <span className="rounded bg-white px-2 py-1 text-xs text-slate-600">{activity.status}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{activity.optionLabel}</p>
              <p className="mt-2 font-mono text-xs text-slate-500">{shortenAddress(activity.txHash, 8, 8)}</p>
              <time className="mt-1 block text-xs text-slate-400">
                {new Date(activity.timestamp).toLocaleString()}
              </time>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
