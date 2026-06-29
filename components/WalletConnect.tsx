"use client";

import { Copy, LogOut, Repeat2, Wallet } from "lucide-react";

import { shortenAddress } from "@/lib/format";

type Props = {
  publicKey?: string;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onSwitchWallet: () => Promise<void>;
};

export function WalletConnect({ publicKey, onConnect, onDisconnect, onSwitchWallet }: Props) {
  async function copyAddress() {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey);
    }
  }

  if (!publicKey) {
    return (
      <button
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        onClick={onConnect}
        type="button"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 font-mono text-xs text-emerald-900">
        {shortenAddress(publicKey)}
      </span>
      <button
        aria-label="Copy connected wallet address"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
        onClick={copyAddress}
        type="button"
      >
        <Copy className="h-4 w-4" />
      </button>
      <button
        aria-label="Switch wallet"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-cyan-200 bg-cyan-50 text-cyan-700 transition hover:bg-cyan-100"
        onClick={onSwitchWallet}
        title="Switch wallet"
        type="button"
      >
        <Repeat2 className="h-4 w-4" />
      </button>
      <button
        aria-label="Disconnect wallet"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
        onClick={onDisconnect}
        type="button"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
