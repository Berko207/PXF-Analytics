"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { WalletClient } from "viem";

import { getActiveChain } from "@/lib/wallet/chains";
import {
  getInjectedProvider,
  getWalletClient,
  hasInjectedWallet,
  requestAccount,
  switchToActiveChain,
} from "@/lib/wallet/injected";

export type WalletStatus = "disconnected" | "connecting" | "connected";

interface WalletState {
  status: WalletStatus;
  address: string | null;
  chainId: number | null;
  /** True when connected but on a different chain than the app expects. */
  wrongNetwork: boolean;
  hasWallet: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  /** A live viem WalletClient — null until connected. */
  getClient: () => WalletClient | null;
}

/** Minimal EIP-1193 event surface (looser than viem's strict overloads). */
interface EventfulProvider {
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeChainId = getActiveChain().id;

  const refreshChain = useCallback(async () => {
    try {
      setChainId(await getWalletClient().getChainId());
    } catch {
      /* wallet not available */
    }
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    if (!hasInjectedWallet()) {
      setError("No browser wallet found. Install MetaMask to continue.");
      return;
    }
    setStatus("connecting");
    try {
      const addr = await requestAccount();
      setAddress(addr);
      await refreshChain();
      setStatus("connected");
    } catch (err) {
      setStatus("disconnected");
      setError(err instanceof Error ? err.message : "Failed to connect wallet.");
    }
  }, [refreshChain]);

  const disconnect = useCallback(() => {
    // Injected wallets can't be force-disconnected; we just drop local state.
    setAddress(null);
    setStatus("disconnected");
    setError(null);
  }, []);

  const switchNetwork = useCallback(async () => {
    setError(null);
    try {
      await switchToActiveChain();
      await refreshChain();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to switch network.");
    }
  }, [refreshChain]);

  // Reflect wallet-driven account/chain changes back into local state. viem's
  // EIP1193 event overloads are strict; treat the provider as a plain emitter.
  useEffect(() => {
    const provider = getInjectedProvider() as EventfulProvider | null;
    if (!provider?.on) return;

    const onAccounts = (...args: unknown[]) => {
      const accounts = (args[0] as string[]) ?? [];
      if (accounts.length === 0) {
        setAddress(null);
        setStatus("disconnected");
      } else {
        setAddress(accounts[0]);
        setStatus("connected");
      }
    };
    const onChain = (...args: unknown[]) => setChainId(Number(args[0]));

    provider.on("accountsChanged", onAccounts);
    provider.on("chainChanged", onChain);
    return () => {
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const value = useMemo<WalletState>(
    () => ({
      status,
      address,
      chainId,
      wrongNetwork: status === "connected" && chainId !== null && chainId !== activeChainId,
      hasWallet: hasInjectedWallet(),
      error,
      connect,
      disconnect,
      switchNetwork,
      getClient: () => (status === "connected" ? getWalletClient() : null),
    }),
    [status, address, chainId, activeChainId, error, connect, disconnect, switchNetwork]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>.");
  return ctx;
}
