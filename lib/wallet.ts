"use client";

import {
  KitEventType,
  Networks,
  StellarWalletsKit,
} from "@creit.tech/stellar-wallets-kit";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";

import { clearWalletKitStorage } from "./wallet-storage";

let initialized = false;

export function getWalletKit(): typeof StellarWalletsKit {
  if (!initialized) {
    StellarWalletsKit.init({
      modules: defaultModules(),
      network: Networks.TESTNET,
      authModal: {
        hideUnsupportedWallets: false,
        showInstallLabel: true,
      },
    });
    initialized = true;
  }

  return StellarWalletsKit;
}

export async function connectWallet(): Promise<string> {
  const kit = getWalletKit();
  kit.setNetwork(Networks.TESTNET);
  const { address } = await kit.authModal();
  return address;
}

export async function disconnectWallet(): Promise<void> {
  await getWalletKit().disconnect();
  clearWalletKitStorage();
}

export async function switchWallet(): Promise<string> {
  await disconnectWallet();
  clearWalletKitStorage();
  return connectWallet();
}

export async function signTransactionXdr(address: string, xdr: string): Promise<string> {
  const { signedTxXdr } = await getWalletKit().signTransaction(xdr, {
    address,
    networkPassphrase: Networks.TESTNET,
  });
  return signedTxXdr;
}

export async function assertWalletTestnet(): Promise<void> {
  const network = await getWalletKit().getNetwork();
  if (network.networkPassphrase !== Networks.TESTNET) {
    throw new Error("Wrong network. Please switch your wallet to Stellar Testnet.");
  }
}

export function onWalletDisconnect(callback: () => void): () => void {
  return getWalletKit().on(KitEventType.DISCONNECT, callback);
}
