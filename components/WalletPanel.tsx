"use client";

import { Copy, LogOut, Repeat2, ShieldCheck, Wallet } from "lucide-react";

import { shortenAddress } from "@/lib/format";

type Props = {
  publicKey?: string;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onSwitchWallet: () => Promise<void>;
};

export function WalletPanel({ publicKey, onConnect, onDisconnect, onSwitchWallet }: Props) {
  const connected = Boolean(publicKey);

  async function copyAddress() {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wallet</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            {connected ? "Wallet connected" : "Connect to vote"}
          </h2>
        </div>
        <Wallet className={`h-6 w-6 ${connected ? "text-emerald-600" : "text-slate-500"}`} />
      </div>

      {connected ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4" />
              Ready on Stellar Testnet
            </div>
            <p className="mt-2 text-emerald-800">
              This address signs the vote transaction and is checked against contract state.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <span className="text-slate-500">Connected address</span>
            <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="min-w-0 break-all font-mono text-xs text-slate-900">
                {shortenAddress(publicKey ?? "", 10, 10)}
              </span>
              <button
                aria-label="Copy wallet address"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                onClick={copyAddress}
                type="button"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100"
              onClick={onSwitchWallet}
              type="button"
            >
              <Repeat2 className="h-4 w-4" />
              Switch
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={onDisconnect}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
            Connect a supported Stellar wallet to sign one real Soroban vote transaction on
            Testnet.
          </p>
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            onClick={onConnect}
            type="button"
          >
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </button>
        </div>
      )}
    </section>
  );
}
