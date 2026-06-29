import { addressArg, assertLiveContracts, simulateContractCall } from "./contract-client";
import { getContractConfig } from "./env";

export type ReputationLevel = "newcomer" | "participant" | "contributor" | "governor";

export type ReputationProfile = {
  points: number;
  level: ReputationLevel;
};

export function reputationLevel(points: number): ReputationLevel {
  if (points >= 5) {
    return "governor";
  }

  if (points >= 3) {
    return "contributor";
  }

  if (points >= 1) {
    return "participant";
  }

  return "newcomer";
}

function normalizeLevel(level: unknown, points: number): ReputationLevel {
  const value = String(level);
  if (
    value === "newcomer" ||
    value === "participant" ||
    value === "contributor" ||
    value === "governor"
  ) {
    return value;
  }

  return reputationLevel(points);
}

export async function getPoints(walletAddress: string): Promise<number> {
  const config = getContractConfig();
  assertLiveContracts(config);
  const points = await simulateContractCall<number | bigint>(
    config.reputationContractId,
    "get_points",
    [addressArg(walletAddress)],
  );

  return Number(points);
}

export async function getLevel(walletAddress: string): Promise<ReputationLevel> {
  const config = getContractConfig();
  assertLiveContracts(config);
  const points = await getPoints(walletAddress);
  const level = await simulateContractCall<unknown>(config.reputationContractId, "get_level", [
    addressArg(walletAddress),
  ]);

  return normalizeLevel(level, points);
}

export async function getGovernanceContract(): Promise<string> {
  const config = getContractConfig();
  assertLiveContracts(config);
  const address = await simulateContractCall<unknown>(
    config.reputationContractId,
    "get_governance_contract",
  );

  return String(address);
}

export async function getReputationProfile(walletAddress: string): Promise<ReputationProfile> {
  const points = await getPoints(walletAddress);
  const level = await getLevel(walletAddress);

  return {
    points,
    level,
  };
}
