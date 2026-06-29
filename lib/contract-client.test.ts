import { describe, expect, it } from "vitest";

import type { ContractConfig } from "./env";
import { assertLiveContracts, getContractMode } from "./contract-client";

function config(overrides: Partial<ContractConfig>): ContractConfig {
  return {
    governanceContractId: "",
    reputationContractId: "",
    network: "testnet",
    rpcUrl: "https://soroban-testnet.stellar.org",
    governanceConfigured: false,
    reputationConfigured: false,
    allConfigured: false,
    ...overrides,
  };
}

describe("contract-client mode helpers", () => {
  it("returns preview mode when contract ids are missing", () => {
    expect(getContractMode(config({}))).toBe("preview");
  });

  it("returns live mode when both governance and reputation ids are configured", () => {
    expect(
      getContractMode(
        config({
          governanceContractId: "CGOVERNANCE",
          reputationContractId: "CREPUTATION",
          governanceConfigured: true,
          reputationConfigured: true,
          allConfigured: true,
        }),
      ),
    ).toBe("live");
  });

  it("throws a readable error before live vote calls when ids are missing", () => {
    expect(() => assertLiveContracts(config({}))).toThrow(
      "Missing contract env. Configure Governance and Reputation contract IDs before using live mode.",
    );
  });
});
