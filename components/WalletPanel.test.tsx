import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { WalletPanel } from "./WalletPanel";

describe("WalletPanel", () => {
  it("renders disconnected wallet connect action", () => {
    const html = renderToStaticMarkup(
      <WalletPanel
        onConnect={async () => undefined}
        onDisconnect={async () => undefined}
        onSwitchWallet={async () => undefined}
      />,
    );

    expect(html).toContain("Connect Wallet");
    expect(html).toContain("Connect a Stellar wallet to vote on proposals.");
  });
});
