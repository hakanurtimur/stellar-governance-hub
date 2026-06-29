export type ProposalOption = {
  id: number;
  label: string;
  votes: number;
};

export type ProposalState = {
  configured: boolean;
  id: number;
  title: string;
  description: string;
  options: ProposalOption[];
  totalVotes: number;
  hasVoted: boolean;
  open: boolean;
  latestLedger?: number;
};
