import { describe, expect, it, vi } from "vitest";

import { clearWalletKitStorage, walletKitStorageKeys } from "./wallet-storage";

describe("clearWalletKitStorage", () => {
  it("removes StellarWalletsKit session and selection keys", () => {
    const removeItem = vi.fn();
    const storage = { removeItem } as unknown as Storage;

    clearWalletKitStorage(storage);

    expect(removeItem).toHaveBeenCalledTimes(walletKitStorageKeys.length);
    expect(removeItem).toHaveBeenCalledWith("@StellarWalletsKit/selectedModuleId");
    expect(removeItem).toHaveBeenCalledWith("@StellarWalletsKit/usedWalletsIds");
    expect(removeItem).toHaveBeenCalledWith("@StellarWalletsKit/activeAddress");
  });
});
