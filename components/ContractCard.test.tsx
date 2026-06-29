import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ContractCard } from "./ContractCard";

describe("ContractCard", () => {
  it("shows separate governance and reputation contract placeholders", () => {
    const html = renderToStaticMarkup(<ContractCard />);

    expect(html).toContain("Governance Contract ID");
    expect(html).toContain("Reputation Contract ID");
    expect(html).toContain("Not configured");
  });
});
