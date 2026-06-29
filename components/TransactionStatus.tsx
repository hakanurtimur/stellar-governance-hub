"use client";

import { CheckCircle2, Clock3, Copy, ExternalLink, Loader2, XCircle } from "lucide-react";

import { type TransactionStatus as Status } from "@/lib/format";
import type { LastTransaction } from "@/lib/transaction-state";

type Props = {
  status: Status;
  lastTransaction?: LastTransaction;
  error?: string;
};

const statusLabels: Record<Status, string> = {
  idle: "Idle",
  preparing: "Preparing transaction",
  awaiting_signature: "Awaiting signature",
  pending: "Pending on testnet",
  success: "Success",
  failed: "Failed",
};

const statusDescriptions: Record<Status, string> = {
  idle: "No vote transaction has been submitted in this browser session yet.",
  preparing: "Building and simulating the Soroban vote transaction.",
  awaiting_signature: "Confirm the vote in your wallet to sign the transaction.",
  pending: "Submitting the signed transaction to Stellar Testnet.",
  success: "Vote submitted successfully. Your vote was recorded on Stellar Testnet.",
  failed: "Transaction failed or was rejected. Review the message below and try again.",
};

export function TransactionStatus({ status, lastTransaction, error }: Props) {
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Transaction status
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">{statusLabels[status]}</h2>
        </div>
        <Icon
          className={`h-6 w-6 ${isBusy ? "animate-spin text-cyan-600" : ""} ${
            isSuccess ? "text-emerald-600" : ""
          } ${isFailed ? "text-rose-600" : "text-slate-500"}`}
        />
      </div>
      <p className="mt-3 text-sm text-slate-600">{statusDescriptions[status]}</p>

      <div className="mt-5 space-y-3 rounded-md bg-slate-50 p-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">Current status</span>
          <span className="font-medium text-slate-900">{status}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">Transaction hash</span>
          <span className="min-w-0 break-all text-right font-mono text-xs text-slate-900">
            {lastTransaction ? lastTransaction.hash : "None yet"}
          </span>
        </div>
        {lastTransaction ? (
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
              target="_blank"
              rel="noreferrer"
            >
              View on Stellar Expert <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ) : null}
        {error ? <p className="rounded-md bg-rose-50 p-3 text-rose-700">{error}</p> : null}
      </div>
    </section>
  );
}
