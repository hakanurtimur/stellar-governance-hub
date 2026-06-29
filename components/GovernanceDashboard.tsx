"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createLocalVoteActivity } from "../lib/activity";
import { getContractMode } from "../lib/contract-client";
import { getContractConfig } from "../lib/env";
import { formatContractError } from "../lib/errors";
import {
  governancePreviewProposals,
  loadGovernanceProposals,
  voteOnProposal,
  type ProposalState,
} from "../lib/governance";
import { getReputationProfile, type ReputationProfile } from "../lib/reputation";
import {
  initialTransactionState,
  recordFailedTransaction,
  recordSuccessfulTransaction,
  resetTransactionState,
  startTransaction,
  type LastTransaction,
} from "../lib/transaction-state";
import {
  assertWalletTestnet,
  connectWallet,
  disconnectWallet,
  switchWallet,
} from "../lib/wallet";
import { ActivityFeed } from "./ActivityFeed";
import { ContractInfoCard } from "./ContractInfoCard";
import { ProposalDetail } from "./ProposalDetail";
import { ProposalList } from "./ProposalList";
import { ReputationCard } from "./ReputationCard";
import { TransactionStatusCard } from "./TransactionStatusCard";
import { VotePanel } from "./VotePanel";
import { WalletPanel } from "./WalletPanel";

export function GovernanceDashboard() {
  const config = useMemo(() => getContractConfig(), []);
  const mode = getContractMode(config);
  const [publicKey, setPublicKey] = useState<string>();
  const [proposals, setProposals] = useState<ProposalState[]>(() => governancePreviewProposals());
  const [selectedProposalId, setSelectedProposalId] = useState<number>(proposals[0]?.id ?? 0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [transactionState, setTransactionState] = useState(initialTransactionState);
  const [activities, setActivities] = useState<ReturnType<typeof createLocalVoteActivity>[]>([]);
  const [error, setError] = useState<string>();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>();
  const [loadingProposals, setLoadingProposals] = useState(mode === "live");
  const [loadingReputation, setLoadingReputation] = useState(false);
  const [reputation, setReputation] = useState<ReputationProfile>({ points: 0, level: "newcomer" });

  const selectedProposal = useMemo(
    () => proposals.find((proposal) => proposal.id === selectedProposalId),
    [proposals, selectedProposalId],
  );

  const selectedOptionLabel = selectedProposal?.options.find((option) => option.id === selectedOption)?.label;
  const lastTransaction = transactionState.lastTransaction as
    | (LastTransaction & { proposalTitle?: string })
    | undefined;

  const resetWalletSessionUi = useCallback(() => {
    setPublicKey(undefined);
    setSelectedOption(null);
    setTransactionState(resetTransactionState());
    setError(undefined);
  }, []);

  const refreshLiveState = useCallback(async () => {
    if (mode !== "live") {
      setProposals(governancePreviewProposals());
      setLoadingProposals(false);
      return;
    }

    setSyncing(true);
    setLoadingProposals(true);
    setLoadingReputation(Boolean(publicKey));

    try {
      const [nextProposals, nextReputation] = await Promise.all([
        loadGovernanceProposals(publicKey),
        publicKey ? getReputationProfile(publicKey) : Promise.resolve({ points: 0, level: "newcomer" as const }),
      ]);

      setProposals(nextProposals);
      setReputation(nextReputation);
      setSelectedProposalId((current) => {
        if (nextProposals.some((proposal) => proposal.id === current)) {
          return current;
        }

        return nextProposals[0]?.id ?? 0;
      });
      setLastSyncedAt(new Date());
      setError(undefined);
    } catch (nextError) {
      setError(formatContractError(nextError));
    } finally {
      setLoadingProposals(false);
      setLoadingReputation(false);
      setSyncing(false);
    }
  }, [mode, publicKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshLiveState();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshLiveState]);

  async function handleConnect() {
    try {
      setError(undefined);
      const address = await connectWallet();
      await assertWalletTestnet();
      setPublicKey(address);
    } catch (nextError) {
      setError(formatContractError(nextError));
    }
  }

  async function handleDisconnect() {
    await disconnectWallet();
    resetWalletSessionUi();
  }

  async function handleSwitchWallet() {
    try {
      setError(undefined);
      resetWalletSessionUi();
      const address = await switchWallet();
      await assertWalletTestnet();
      setPublicKey(address);
    } catch (nextError) {
      setError(formatContractError(nextError));
    }
  }

  function handleSelectProposal(proposalId: number) {
    setSelectedProposalId(proposalId);
    setSelectedOption(null);
  }

  function refreshLocalState() {
    if (mode === "live") {
      void refreshLiveState();
      return;
    }

    setSyncing(true);
    window.setTimeout(() => {
      setLastSyncedAt(new Date());
      setSyncing(false);
    }, 350);
  }

  async function handleVote() {
    if (!publicKey || !selectedProposal || selectedOption === null) {
      return;
    }

    if (!config.allConfigured) {
      setError("Missing contract env. Configure Governance and Reputation contract IDs before voting.");
      return;
    }

    if (selectedProposal.isPreview) {
      setError("Select a live proposal before submitting a Testnet vote.");
      return;
    }

    const optionLabel = selectedOptionLabel ?? `Option ${selectedOption}`;

    try {
      setError(undefined);
      setTransactionState((current) => startTransaction(current, "preparing"));
      await assertWalletTestnet();
      setTransactionState((current) => startTransaction(current, "awaiting_signature"));
      const result = await voteOnProposal({
        walletAddress: publicKey,
        proposalId: selectedProposal.id,
        optionIndex: selectedOption,
      });
      setTransactionState((current) => startTransaction(current, "pending"));

      if (result.status === "success") {
        const submittedAt = new Date().toISOString();
        setTransactionState((current) =>
          recordSuccessfulTransaction(current, {
            hash: result.hash,
            optionIndex: selectedOption,
            optionLabel,
            proposalTitle: selectedProposal.title,
            submittedAt,
          }),
        );
        setActivities((current) => [
          createLocalVoteActivity({
            hash: result.hash,
            proposalTitle: selectedProposal.title,
            optionLabel,
            submittedAt,
          }),
          ...current,
        ]);
        await refreshLiveState();
      } else {
        setTransactionState((current) =>
          recordFailedTransaction(current, "Vote transaction was not confirmed on Stellar Testnet."),
        );
      }
    } catch (nextError) {
      const message = formatContractError(nextError);
      setTransactionState((current) => recordFailedTransaction(current, message));
      setError(message);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
                Stellar Governance Hub
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Proposal voting with on-chain reputation rewards
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Stellar Testnet", "Governance Contract", "Reputation Contract", "Inter-contract Rewards"].map(
                (badge) => (
                  <span
                    className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
                    key={badge}
                  >
                    {badge}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          {error ? (
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <ContractInfoCard
              contractId={config.governanceContractId}
              description="Creates proposals, records votes, emits governance events, and calls the Reputation contract after successful voting."
              title="Governance Contract"
            />
            <ContractInfoCard
              contractId={config.reputationContractId}
              description="Tracks participation points per wallet and emits reputation award events after authorized governance votes."
              title="Reputation Contract"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
            <ProposalList
              contractsConfigured={config.allConfigured}
              loading={loadingProposals}
              onSelect={handleSelectProposal}
              proposals={proposals}
              selectedProposalId={selectedProposalId}
            />
            <ProposalDetail
              onSelectOption={setSelectedOption}
              proposal={selectedProposal}
              selectedOption={selectedOption}
              walletConnected={Boolean(publicKey)}
            />
          </div>
        </div>

        <aside className="space-y-5">
          <WalletPanel
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onSwitchWallet={handleSwitchWallet}
            publicKey={publicKey}
          />
          <VotePanel
            contractsConfigured={config.allConfigured}
            onVote={handleVote}
            proposal={selectedProposal}
            selectedOption={selectedOption}
            transactionError={transactionState.error ?? error}
            transactionStatus={transactionState.status}
            walletConnected={Boolean(publicKey)}
          />
          <ReputationCard
            level={reputation.level}
            loading={loadingReputation}
            points={reputation.points}
            publicKey={publicKey}
            reputationConfigured={config.reputationConfigured}
          />
          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={refreshLocalState}
            type="button"
          >
            <RefreshCcw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Refreshing state..." : "Refresh dashboard state"}
          </button>
          {lastSyncedAt ? (
            <p className="-mt-3 text-center text-xs text-slate-500">
              Last refreshed {lastSyncedAt.toLocaleTimeString()}
            </p>
          ) : null}
          <TransactionStatusCard
            error={transactionState.error}
            lastTransaction={lastTransaction}
            status={transactionState.status}
          />
          <ActivityFeed activities={activities} syncing={syncing} />
        </aside>
      </div>
    </main>
  );
}
