export const walletKitStorageKeys = [
  "@StellarWalletsKit/usedWalletsIds",
  "@StellarWalletsKit/activeAddress",
  "@StellarWalletsKit/selectedModuleId",
  "@StellarWalletsKit/hardwareWalletPaths",
  "@StellarWalletsKit/wcSessionPaths",
] as const;

export function clearWalletKitStorage(storage: Storage | undefined = globalThis.localStorage) {
  if (!storage) {
    return;
  }

  for (const key of walletKitStorageKeys) {
    storage.removeItem(key);
  }
}
