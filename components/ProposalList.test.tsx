import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProposalList } from "./ProposalList";
import { governancePreviewProposals } from "../lib/governance";

describe("ProposalList", () => {
  it("shows the missing contract env configuration warning", () => {
    const html = renderToStaticMarkup(
      <ProposalList
        contractsConfigured={false}
        onSelect={() => undefined}
        proposals={governancePreviewProposals()}
        selectedProposalId={1}
      />,
    );

    expect(html).toContain("Contracts are not deployed/configured yet.");
    expect(html).toContain("Add Governance and Reputation contract IDs to enable live proposal reads.");
    expect(html).toContain("Local preview data");
  });
});
