import { NextResponse } from "next/server";
import { parseUnits } from "viem";

import { getActiveChain } from "@/lib/wallet/chains";
import {
  getMarketProvider,
  getMarketsProviderKind,
  getMarketsEnv,
} from "@/lib/markets";
import type { Hex, RawTx } from "@/lib/markets/types";

export const runtime = "nodejs";

interface BuyBody {
  outcome?: "red" | "blue";
  /** Human-readable stake (e.g. "5" → 5 USDC); converted with token decimals. */
  amount?: string;
  walletAddress?: string;
}

/**
 * Build the unsigned buy transaction for a market. The Rain SDK + subgraph stay
 * server-side (same as create/resolve); the browser wallet only signs the raw
 * tx we hand back. In mock mode this records a simulated fill instead.
 *
 * Public (no staff gate) — placing a bet is a fan action. The wallet still has
 * to sign, so nothing moves without the user's explicit approval.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const marketId = params.id;
  if (!marketId) {
    return NextResponse.json({ error: "Missing market id." }, { status: 400 });
  }

  let body: BuyBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { outcome, amount, walletAddress } = body;
  if (outcome !== "red" && outcome !== "blue") {
    return NextResponse.json({ error: "outcome must be 'red' or 'blue'." }, { status: 400 });
  }
  if (!walletAddress) {
    return NextResponse.json({ error: "walletAddress is required." }, { status: 400 });
  }

  const env = getMarketsEnv();
  let amountWei: bigint;
  try {
    amountWei = parseUnits((amount ?? "").trim(), env.tokenDecimals);
  } catch {
    return NextResponse.json({ error: "amount is not a valid number." }, { status: 400 });
  }
  if (amountWei <= BigInt(0)) {
    return NextResponse.json({ error: "amount must be greater than 0." }, { status: 400 });
  }

  const provider = getMarketProvider();

  try {
    const built = await provider.buildBuy({
      marketId,
      outcome,
      amount: amountWei,
      walletAddress,
    });

    if (getMarketsProviderKind() !== "rain") {
      // Mock provider returns a simulated fill, not an onchain tx.
      return NextResponse.json({ kind: "mock", fill: built });
    }

    // Rain returns an unsigned RawTx; serialize bigint `value` for JSON.
    // NOTE: depending on the Rain environment the base token may need an ERC-20
    // approval before the first buy. If a buy reverts with "allowance", approve
    // RAIN_BASE_TOKEN for the market contract once from the connected wallet.
    const tx = built as RawTx;
    return NextResponse.json({
      kind: "raw",
      chainId: getActiveChain().id,
      txs: [
        {
          to: tx.to,
          data: tx.data,
          value: tx.value !== undefined ? tx.value.toString() : undefined,
        },
      ] satisfies SerializedTx[],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface SerializedTx {
  to: Hex;
  data: Hex;
  value?: string;
}
