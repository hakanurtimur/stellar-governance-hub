"use client";

import { CheckCircle2, Clock3, Copy, ExternalLink, Loader2, XCircle } from "lucide-react";

import type { TransactionStatus } from "../lib/format";
import type { LastTransaction } from "../lib/transaction-state";

type Props = {
  status: TransactionStatus;
  lastTransaction?: LastTransaction & {
    proposalTitle?: string;
  };
  error?: string;
};

const statusLabels: Record<TransactionStatus, string> = {
  idle: "idle",
  preparing: "submitting",
  awaiting_signature: "awaiting_wallet",
  pending: "submitting",
  success: "success",
  failed: "error",
};

export function TransactionStatusCard({ status, lastTransaction, error }: Props) {
  const isBusy = status === "preparing" || status === "awaiting_signature" || status === "pending";
  const isSuccess = status === "success";
  const isFailed = status === "failed";
  const Icon = isSuccess ? CheckCircle2 : isFailed ? XCircle : isBusy ? Loader2 : Clock3;

  async function copyTxHash() {
    if (lastTransaction) {
      await navigator.clipboard.writeText(lastTransaction.hash);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Transaction status
          </p>
          <h2 className="mt-1 text-xl font-semibold capitalize text-slate-950">
            {statusLabels[status]}
          </h2>
        </div>
        <Icon
          className={`h-5 w-5 ${isBusy ? "animate-spin text-cyan-600" : ""} ${
            isSuccess ? "text-emerald-600" : isFailed ? "text-rose-600" : "text-slate-500"
          }`}
        />
      </div>

      <div className="mt-5 space-y-3 rounded-md bg-slate-50 p-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">Status</span>
          <span className="font-medium text-slate-900">{statusLabels[status]}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">Transaction hash</span>
          <span className="min-w-0 break-all text-right font-mono text-xs text-slate-900">
            {lastTransaction ? lastTransaction.hash : "None yet"}
          </span>
        </div>
        {lastTransaction ? (
          <>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Proposal</span>
              <span className="text-right font-medium text-slate-900">
                {lastTransaction.proposalTitle ?? "Selected proposal"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Option</span>
              <span className="text-right font-medium text-slate-900">{lastTransaction.optionLabel}</span>
            </div>
            <p className="rounded-md bg-emerald-50 p-3 font-medium text-emerald-800">
              Reputation point awarded.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="inline-flex items-center gap-2 font-medium text-slate-700 hover:text-slate-950"
                onClick={copyTxHash}
                type="button"
              >
                <Copy className="h-4 w-4" />
                Copy hash
              </button>
              <a
                className="inline-flex items-center gap-2 font-medium text-cyan-700 hover:text-cyan-900"
                href={lastTransaction.explorerUrl}
                rel="noreferrer"
                target="_blank"
              >
                View on Stellar Expert <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </>
        ) : null}
        {error ? <p className="rounded-md bg-rose-50 p-3 text-rose-700">{error}</p> : null}
      </div>
    </section>
  );
}
