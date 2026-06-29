"use client";

import { Copy, ExternalLink, FileCode2 } from "lucide-react";

import { contractExplorerUrl } from "../lib/explorer";
import { shortenAddress } from "../lib/format";

type Props = {
  title: "Governance Contract" | "Reputation Contract";
  contractId: string;
  description: string;
};

export function ContractInfoCard({ title, contractId, description }: Props) {
  const configured = Boolean(contractId);

  async function copyContractId() {
    if (configured) {
      await navigator.clipboard.writeText(contractId);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contract</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <FileCode2 className="h-5 w-5 shrink-0 text-cyan-600" />
      </div>

      <div className="mt-4 rounded-md bg-slate-50 p-3">
        <p className="text-xs text-slate-500">Contract ID</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="min-w-0 break-all font-mono text-xs text-slate-900">
            {configured ? shortenAddress(contractId, 10, 10) : "Not configured yet"}
          </span>
          {configured ? (
            <button
              aria-label={`Copy ${title} ID`}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              onClick={copyContractId}
              type="button"
            >
              <Copy className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        {configured ? (
          <a
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-900"
            href={contractExplorerUrl(contractId)}
            rel="noreferrer"
            target="_blank"
          >
            Open on Stellar Expert <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
      </div>
    </section>
  );
}
