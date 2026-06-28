"use client";

import { useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConnectedWalletExecutor } from "@/lib/markets/execution/connected";
import { explorerTxUrl, isTestnet } from "@/lib/wallet/chains";
import type { Hex, RawTx } from "@/lib/markets/types";
import { cn } from "@/lib/utils";
import { useWallet } from "@/components/wallet/wallet-provider";

const TOKEN_SYMBOL =
  process.env.NEXT_PUBLIC_TOKEN_SYMBOL ?? (isTestnet() ? "USDC" : "USDT");

interface SerializedTx {
  to: Hex;
  data: Hex;
  value?: string;
}

interface BuyResponse {
  kind?: "raw" | "mock";
  txs?: SerializedTx[];
  fill?: { txId?: string };
  error?: string;
}

interface BetDialogProps {
  marketId: string;
  redName: string;
  blueName: string;
  redProb: number;
  blueProb: number;
}

export function BetDialog({ marketId, redName, blueName, redProb, blueProb }: BetDialogProps) {
  const { status, wrongNetwork, address, connect, switchNetwork, getClient } = useWallet();
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<"red" | "blue">("red");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ txHash?: string; simulated?: boolean } | null>(null);

  const connected = status === "connected" && !!address;

  async function placeBet() {
    setError(null);
    setResult(null);

    if (!connected) {
      await connect();
      return;
    }
    if (wrongNetwork) {
      await switchNetwork();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/markets/${encodeURIComponent(marketId)}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, amount, walletAddress: address }),
      });
      const data: BuyResponse = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to build the bet.");

      if (data.kind === "mock") {
        setResult({ simulated: true });
        return;
      }

      const client = getClient();
      if (!client) throw new Error("Wallet client unavailable — reconnect and retry.");

      const txs: RawTx[] = (data.txs ?? []).map((t) => ({
        to: t.to,
        data: t.data,
        value: t.value !== undefined ? BigInt(t.value) : undefined,
      }));
      if (txs.length === 0) throw new Error("No transaction was built for this bet.");

      const [txHash] = await new ConnectedWalletExecutor(client).send(txs);
      setResult({ txHash });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bet failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const ctaLabel = !connected
    ? "Connect wallet to bet"
    : wrongNetwork
      ? "Switch network"
      : submitting
        ? "Confirm in wallet…"
        : `Bet on ${outcome === "red" ? redName.split(" ")[0] : blueName.split(" ")[0]}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="w-full">
          <TrendingUp className="size-3.5" />
          Place bet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Place a bet</DialogTitle>
          <DialogDescription>
            {isTestnet()
              ? "Testnet — you trade with fake-value tokens. No real money at risk."
              : "Live market — this spends real funds from your wallet."}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="size-10 text-emerald-400" />
            <p className="text-sm font-medium">
              {result.simulated ? "Simulated fill recorded" : "Bet submitted"}
            </p>
            {result.txHash ? (
              <a
                href={explorerTxUrl(result.txHash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View transaction <ExternalLink className="size-3" />
              </a>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => setResult(null)}>
              Place another
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <OutcomeButton
                corner="red"
                name={redName}
                prob={redProb}
                selected={outcome === "red"}
                onClick={() => setOutcome("red")}
              />
              <OutcomeButton
                corner="blue"
                name={blueName}
                prob={blueProb}
                selected={outcome === "blue"}
                onClick={() => setOutcome("blue")}
              />
            </div>

            <label className="mt-1 block space-y-1.5">
              <span className="text-xs text-muted-foreground">Stake ({TOKEN_SYMBOL})</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-9 w-full rounded-lg border border-border bg-input/30 px-3 font-mono text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>

            {error ? <p className="text-xs text-destructive">{error}</p> : null}

            <DialogFooter>
              <Button
                onClick={placeBet}
                disabled={submitting || (connected && !wrongNetwork && !amount)}
                className="w-full"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                {ctaLabel}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OutcomeButton({
  corner,
  name,
  prob,
  selected,
  onClick,
}: {
  corner: "red" | "blue";
  name: string;
  prob: number;
  selected: boolean;
  onClick: () => void;
}) {
  const accent = corner === "red" ? "text-red-400" : "text-blue-400";
  const ring =
    corner === "red"
      ? "border-red-500/60 bg-red-500/10"
      : "border-blue-500/60 bg-blue-500/10";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border p-3 text-left transition-colors",
        selected ? ring : "border-border bg-muted/15 hover:bg-muted/30"
      )}
    >
      <p className={cn("truncate text-xs font-medium", accent)} title={name}>
        {name}
      </p>
      <p className={cn("mt-1 font-mono text-lg font-semibold tabular-nums", accent)}>{prob}%</p>
    </button>
  );
}
