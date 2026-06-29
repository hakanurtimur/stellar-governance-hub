import {
  GOVERNANCE_CONTRACT_ID,
  REPUTATION_CONTRACT_ID,
  STELLAR_NETWORK,
  STELLAR_RPC_URL,
} from "./stellar";

export type ContractConfig = {
  governanceContractId: string;
  reputationContractId: string;
  network: string;
  rpcUrl: string;
  governanceConfigured: boolean;
  reputationConfigured: boolean;
  allConfigured: boolean;
};

export function getContractConfig(): ContractConfig {
  const governanceContractId = GOVERNANCE_CONTRACT_ID;
  const reputationContractId = REPUTATION_CONTRACT_ID;

  return {
    governanceContractId,
    reputationContractId,
    network: STELLAR_NETWORK,
    rpcUrl: STELLAR_RPC_URL,
    governanceConfigured: Boolean(governanceContractId),
    reputationConfigured: Boolean(reputationContractId),
    allConfigured: Boolean(governanceContractId && reputationContractId),
  };
}
