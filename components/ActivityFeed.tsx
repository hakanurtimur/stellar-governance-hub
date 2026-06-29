import { ExternalLink, RadioTower } from "lucide-react";

import type { ActivityItem } from "../lib/activity";
import { shortHash } from "../lib/activity";

type Props = {
  activities: ActivityItem[];
  syncing: boolean;
};

export function ActivityFeed({ activities, syncing }: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Activity feed</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Live Activity</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          <RadioTower className={`h-4 w-4 ${syncing ? "animate-pulse" : ""}`} />
          {syncing ? "Polling" : "Ready"}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {activities.length === 0 ? (
          <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">
            No activity yet. Vote on a proposal to create the first event.
          </p>
        ) : (
          activities.map((activity) => (
            <article className="rounded-md border border-slate-100 bg-slate-50 p-4" key={activity.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-slate-950">{activity.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{activity.proposalTitle}</p>
                  <p className="mt-1 text-sm text-slate-600">Option: {activity.optionLabel}</p>
                </div>
                {activity.reputationAwarded ? (
                  <span className="w-fit rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                    Reputation awarded
                  </span>
                ) : null}
              </div>
              <p className="mt-3 font-mono text-xs text-slate-500">Tx: {shortHash(activity.txHash)}</p>
              <a
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-900"
                href={activity.explorerUrl}
                rel="noreferrer"
                target="_blank"
              >
                View on Stellar Expert <ExternalLink className="h-4 w-4" />
              </a>
              <time className="mt-2 block text-xs text-slate-400">
                {new Date(activity.timestamp).toLocaleString()}
              </time>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
