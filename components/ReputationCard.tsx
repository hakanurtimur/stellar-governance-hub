import { Award } from "lucide-react";

import { reputationLevel } from "../lib/reputation";

type Props = {
  publicKey?: string;
  points: number;
  reputationConfigured: boolean;
};

export function ReputationCard({ publicKey, points, reputationConfigured }: Props) {
  const connected = Boolean(publicKey);
  const level = reputationLevel(points);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reputation</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Participation level</h2>
        </div>
        <Award className="h-5 w-5 text-cyan-600" />
      </div>

      {!connected ? (
        <p className="mt-5 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
          Connect wallet to view reputation.
        </p>
      ) : !reputationConfigured ? (
        <p className="mt-5 rounded-md bg-amber-50 p-4 text-sm text-amber-800">
          Reputation contract not configured.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-md bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Points</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-slate-950">{points}</p>
          </div>
          <div className="rounded-md bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Level</p>
            <p className="mt-1 text-lg font-semibold capitalize text-slate-950">{level}</p>
          </div>
        </div>
      )}

      <p className="mt-4 text-sm text-slate-500">Earn 1 point per successful proposal vote.</p>
    </section>
  );
}
