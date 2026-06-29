import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ContractInfoCard } from "./ContractInfoCard";

describe("ContractInfoCard", () => {
  it("renders governance and reputation labels with empty env placeholders", () => {
    const governance = renderToStaticMarkup(
      <ContractInfoCard
        contractId=""
        description="Records proposal votes."
        title="Governance Contract"
      />,
    );
    const reputation = renderToStaticMarkup(
      <ContractInfoCard
        contractId=""
        description="Awards participation points."
        title="Reputation Contract"
      />,
    );

    expect(governance).toContain("Governance Contract");
    expect(reputation).toContain("Reputation Contract");
    expect(governance).toContain("Not configured yet");
    expect(reputation).toContain("Not configured yet");
  });
});
