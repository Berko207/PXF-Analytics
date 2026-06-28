export {
  getAllFighters,
  getBoutByNumber,
  getEvent,
  getFightCard as getFightCardAsync,
  getFightCardStatic,
  getFightCardSync,
  getFighterById,
  getFighters,
  getMatchups,
  hasSupabaseConfig,
  loadFightCardFromSupabase,
} from "@/lib/data/index";

/** Sync loader for client components still on static JSON. */
export { getFightCardSync as getFightCard } from "@/lib/data/index";
