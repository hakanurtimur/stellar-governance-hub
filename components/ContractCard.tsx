"use client";

import { Copy, ExternalLink, FileCode2, Network } from "lucide-react";

import { buildContractExplorerUrl, shortenAddress } from "@/lib/format";
import { CONTRACT_ID, STELLAR_NETWORK } from "@/lib/stellar";

export function ContractCard() {
  const hasContract = Boolean(CONTRACT_ID);

  async function copyContractId() {
    if (hasContract) {
      await navigator.clipboard.writeText(CONTRACT_ID);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Contract
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Stellar Testnet proof</h2>
        </div>
        <FileCode2 className="h-6 w-6 text-cyan-600" />
      </div>

      <div className="mt-5 space-y-3 rounded-md bg-slate-50 p-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-slate-500">
            <Network className="h-4 w-4" />
            Network
          </span>
          <span className="font-medium text-slate-900">
            {STELLAR_NETWORK === "public" ? "Stellar Mainnet" : "Stellar Testnet"}
          </span>
        </div>

        <div className="space-y-2">
          <span className="text-slate-500">Contract ID</span>
          <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
            <span className="min-w-0 break-all font-mono text-xs text-slate-900">
              {hasContract ? shortenAddress(CONTRACT_ID, 10, 10) : "Not configured"}
            </span>
            {hasContract ? (
              <button
                aria-label="Copy contract ID"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                onClick={copyContractId}
                type="button"
              >
                <Copy className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {hasContract ? (
          <a
            className="inline-flex items-center gap-2 font-medium text-cyan-700 hover:text-cyan-900"
            href={buildContractExplorerUrl(CONTRACT_ID)}
            rel="noreferrer"
            target="_blank"
          >
            Open contract on Stellar Expert <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <p className="rounded-md bg-amber-50 p-3 text-amber-800">
            Add NEXT_PUBLIC_CONTRACT_ID before deploying this frontend.
          </p>
        )}
      </div>
    </section>
  );
}
