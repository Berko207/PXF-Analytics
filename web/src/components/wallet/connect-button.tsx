"use client";

import { Loader2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isTestnet } from "@/lib/wallet/chains";
import { useWallet } from "@/components/wallet/wallet-provider";

function truncate(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Header wallet control: connect → show address, with a wrong-network nudge. */
export function ConnectButton() {
  const { status, address, wrongNetwork, connect, disconnect, switchNetwork } = useWallet();

  if (status === "connected" && address) {
    if (wrongNetwork) {
      return (
        <Button size="sm" variant="destructive" onClick={switchNetwork}>
          Wrong network — switch
        </Button>
      );
    }
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={disconnect}
        title="Click to disconnect"
        className="font-mono"
      >
        <Wallet className="size-3.5" />
        {truncate(address)}
        {isTestnet() ? <span className="text-amber-400">· testnet</span> : null}
      </Button>
    );
  }

  return (
    <Button size="sm" variant="outline" onClick={connect} disabled={status === "connecting"}>
      {status === "connecting" ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Wallet className="size-3.5" />
      )}
      {status === "connecting" ? "Connecting…" : "Connect Wallet"}
    </Button>
  );
}
