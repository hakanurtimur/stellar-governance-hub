import { shortenAddress } from "./format";

export type ActivityItem = {
  id: string;
  title: string;
  proposalTitle: string;
  optionLabel: string;
  txHash: string;
  explorerUrl: string;
  timestamp: string;
  reputationAwarded: boolean;
};

type LocalVoteActivityInput = {
  hash: string;
  proposalTitle: string;
  optionLabel: string;
  submittedAt: string;
};

export function shortHash(hash: string): string {
  return shortenAddress(hash, 8, 8);
}

export function createLocalVoteActivity({
  hash,
  proposalTitle,
  optionLabel,
  submittedAt,
}: LocalVoteActivityInput): ActivityItem {
  return {
    id: hash,
    title: "Vote submitted",
    proposalTitle,
    optionLabel,
    txHash: hash,
    explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
    timestamp: submittedAt,
    reputationAwarded: true,
  };
}
