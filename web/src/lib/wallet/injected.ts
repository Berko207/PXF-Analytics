"use client";

import { createWalletClient, custom, type WalletClient, type EIP1193Provider } from "viem";

import { getActiveChain } from "@/lib/wallet/chains";

/**
 * Thin wrapper over an injected EIP-1193 wallet (MetaMask, Rabby, Coinbase
 * Wallet, etc.). Zero external services — no WalletConnect project id, no
 * Alchemy key — which is exactly what we want to trade end-to-end on testnet.
 *
 * The viem WalletClient produced here is the same shape `ConnectedWalletExecutor`
 * already expects, so the existing execution layer works unchanged.
 */

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

export function getInjectedProvider(): EIP1193Provider | null {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
}

export function hasInjectedWallet(): boolean {
  return getInjectedProvider() !== null;
}

/** A WalletClient bound to the injected provider + the app's active chain. */
export function getWalletClient(): WalletClient {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No browser wallet found. Install MetaMask to continue.");
  return createWalletClient({ chain: getActiveChain(), transport: custom(provider) });
}

/** Prompt the wallet for accounts; returns the selected address (lowercased). */
export async function requestAccount(): Promise<string> {
  const [address] = await getWalletClient().requestAddresses();
  if (!address) throw new Error("No account authorized in the wallet.");
  return address;
}

/** Read the wallet's current chain id. */
export async function getWalletChainId(): Promise<number> {
  return getWalletClient().getChainId();
}

/**
 * Ensure the wallet is on the app's active chain, adding it first if the wallet
 * doesn't know it (EIP-1193 error 4902 = "unrecognized chain").
 */
export async function switchToActiveChain(): Promise<void> {
  const chain = getActiveChain();
  const client = getWalletClient();
  try {
    await client.switchChain({ id: chain.id });
  } catch (err) {
    if (isUnrecognizedChain(err)) {
      await client.addChain({ chain });
      await client.switchChain({ id: chain.id });
      return;
    }
    throw err;
  }
}

function isUnrecognizedChain(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const code = (err as { code?: number }).code;
  return code === 4902 || code === -32603;
}
