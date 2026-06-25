#!/usr/bin/env python3
"""Generate supabase/seed.sql from the enriched PXF 50 card JSON.

Maps the enriched fight-card JSON into the `pxf` relational schema:
  promoter -> event -> fight_card -> matchups -> fighters
  + fighter_source_records (raw imported corner data, kept separate from canonical)

Data-quality rules enforced here:
  * record == null  -> stored as NULL (UNKNOWN), never fabricated as 0-0-0
  * research_notes  -> only ever land in fighter_source_records (provenance),
                       never on the canonical fighters row
  * win_probability / ELO are NOT seeded (placeholder model; replaced by the
    ELO engine later)

Run:  python3 scripts/seed_pxf50.py   # writes supabase/seed.sql
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARD = os.path.join(ROOT, "web", "src", "data", "pxf50_card.json")
OUT = os.path.join(ROOT, "supabase", "seed.sql")

EVENT_SLUG = "pxf-50"
PROMOTER_SLUG = "pxf"
CARD_NAME = "Main Card"
SOURCE = "pxf50_official_poster"


def q(v):
    """Quote a SQL text literal, or NULL."""
    if v is None:
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"


def num(v):
    return "NULL" if v is None else str(v)


def dq(obj):
    """Dollar-quoted jsonb literal (avoids escaping headaches)."""
    return "$j$" + json.dumps(obj, ensure_ascii=False) + "$j$::jsonb"


def confirmed(notes):
    """True only for genuine positive confirmation.

    Guards against negations like "No confirmed public MMA profile found",
    which must NOT be read as a confirmation.
    """
    n = (notes or "").lower()
    if "no confirmed" in n or "not confirmed" in n or "unconfirmed" in n:
        return False
    return "verified" in n or "confirmed" in n


def collect_fighters(card):
    """Dedupe corners by fighter_id (slug); merge non-null fields."""
    fighters = {}
    order = []
    for bout in card["bouts"]:
        level = bout["level"]
        for corner in (bout["red_corner"], bout["blue_corner"]):
            slug = corner["fighter_id"]
            if slug not in fighters:
                fighters[slug] = {"_level": level, "_raw": corner}
                order.append(slug)
            f = fighters[slug]
            # prefer first non-null for each canonical field
            for key in ("full_name", "display_name", "nickname", "weight_class",
                        "gym", "city", "country", "tapology_url"):
                if not f.get(key) and corner.get(key):
                    f[key] = corner.get(key)
            if f.get("record") is None and corner.get("record") is not None:
                f["record"] = corner["record"]
            f["is_debut"] = f.get("is_debut", False) or corner.get("is_debut", False)
            if corner.get("research_notes") and not f.get("research_notes"):
                f["research_notes"] = corner["research_notes"]
            if corner.get("match_score") is not None:
                f["match_score"] = corner["match_score"]
    return order, fighters


def fighter_rows(order, fighters):
    rows = []
    for slug in order:
        f = fighters[slug]
        raw = f["_raw"]
        name = f.get("full_name") or f.get("display_name")
        rec = f.get("record")
        notes = f.get("research_notes")
        if rec is None:
            wins = losses = draws = ncs = None
            rec_status = "missing"
        else:
            wins, losses, draws, ncs = rec["wins"], rec["losses"], rec["draws"], rec["nc"]
            rec_status = "verified" if confirmed(notes) else "imported"
        field_status = {
            "record": rec_status,
            "gym": "imported" if f.get("gym") else "missing",
            "identity": "verified" if confirmed(notes) else "imported",
        }
        pro_status = "pro" if f["_level"] == "PRO" else "amateur"
        rows.append(
            "  (" + ", ".join([
                q(slug), q(name), q(f.get("nickname")), q(f.get("weight_class")),
                q(f.get("gym")), q(f.get("city")), q(f.get("country")),
                q(pro_status), num(wins), num(losses), num(draws), num(ncs),
                q(f.get("tapology_url")), dq(field_status),
            ]) + ")"
        )
    return rows


def source_rows(order, fighters):
    rows = []
    for slug in order:
        f = fighters[slug]
        raw = f["_raw"]
        src_url = (raw.get("tapology") or {}).get("profile_url") or raw.get("tapology_url")
        conf = raw.get("match_score")
        rows.append(
            "  (" + ", ".join([
                q(slug), q(SOURCE), q(src_url),
                "NULL" if conf is None else str(conf), dq(raw),
            ]) + ")"
        )
    return rows


def matchup_rows(card):
    rows = []
    for bout in card["bouts"]:
        rows.append(
            "  (" + ", ".join([
                str(bout["bout_number"]),
                q(bout["red_corner"]["fighter_id"]),
                q(bout["blue_corner"]["fighter_id"]),
                q(bout["weight_class"]),
                "true" if bout["is_title_fight"] else "false",
            ]) + ")"
        )
    return rows


def main():
    with open(CARD, encoding="utf-8") as fh:
        card = json.load(fh)
    ev = card["event"]
    order, fighters = collect_fighters(card)

    parts = []
    parts.append("-- AUTO-GENERATED by scripts/seed_pxf50.py — do not edit by hand.")
    parts.append("-- Seeds the PXF 50 card into the pxf schema. Idempotent (safe to re-run).")
    parts.append("begin;\n")

    # Promoter
    parts.append(
        "insert into pxf.promoters (name, slug, region) values\n"
        f"  ({q(ev['promotion'])}, {q(PROMOTER_SLUG)}, {q('Sonora, Mexico')})\n"
        "on conflict (slug) do nothing;\n"
    )
    # Event (status 'draft' — not in-app verified yet)
    parts.append(
        "insert into pxf.events (promoter_id, name, slug, event_date, venue, city, country, status)\n"
        f"select id, {q('PXF 50')}, {q(EVENT_SLUG)}, date {q(ev['date'])}, "
        f"{q(ev.get('venue'))}, {q('Hermosillo')}, {q('Mexico')}, 'draft'\n"
        f"from pxf.promoters where slug = {q(PROMOTER_SLUG)}\n"
        "on conflict (slug) do nothing;\n"
    )
    # Fight card
    parts.append(
        "insert into pxf.fight_cards (event_id, name, ordinal)\n"
        f"select id, {q(CARD_NAME)}, 0 from pxf.events where slug = {q(EVENT_SLUG)}\n"
        "on conflict (event_id, name) do nothing;\n"
    )
    # Fighters
    parts.append(
        "insert into pxf.fighters\n"
        "  (slug, full_name, nickname, weight_class, gym, city, country,\n"
        "   pro_status, wins, losses, draws, no_contests, tapology_url, field_status)\nvalues\n"
        + ",\n".join(fighter_rows(order, fighters))
        + "\non conflict (slug) do nothing;\n"
    )
    # Source records (raw imported corner data)
    parts.append(
        "insert into pxf.fighter_source_records\n"
        "  (fighter_id, source, source_url, match_confidence, payload)\nselect\n"
        "  f.id, v.source, v.source_url, v.match_confidence, v.payload\n"
        "from (values\n"
        + ",\n".join(source_rows(order, fighters))
        + "\n) as v(slug, source, source_url, match_confidence, payload)\n"
        "join pxf.fighters f on f.slug = v.slug\n"
        "on conflict (fighter_id, source) do nothing;\n"
    )
    # Matchups
    parts.append(
        "insert into pxf.matchups\n"
        "  (fight_card_id, event_id, bout_order, red_fighter_id, blue_fighter_id, weight_class, is_title_fight)\nselect\n"
        "  c.id, e.id, v.bout_order, rf.id, bf.id, v.weight_class, v.is_title_fight\n"
        "from (values\n"
        + ",\n".join(matchup_rows(card))
        + "\n) as v(bout_order, red_slug, blue_slug, weight_class, is_title_fight)\n"
        f"cross join (select id from pxf.events where slug = {q(EVENT_SLUG)}) e\n"
        f"join pxf.fight_cards c on c.event_id = e.id and c.name = {q(CARD_NAME)}\n"
        "left join pxf.fighters rf on rf.slug = v.red_slug\n"
        "left join pxf.fighters bf on bf.slug = v.blue_slug\n"
        "on conflict (fight_card_id, bout_order) do nothing;\n"
    )

    parts.append("commit;")

    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(parts) + "\n")
    print(f"wrote {OUT}: {len(order)} fighters, {len(card['bouts'])} bouts")


if __name__ == "__main__":
    main()
