import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { claimComment, updateComment } from "../../../lib/store.js";
import { sendPrivateReply } from "../../../lib/instagram.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const norm = (s) => String(s).normalize("NFC").toLowerCase();

function matchesKeyword(text) {
  const keywords = (process.env.KEYWORDS || "")
    .split(",")
    .map((k) => norm(k.trim()))
    .filter(Boolean);
  const t = norm(text);
  return keywords.some((k) => t.includes(k));
}

function validSignature(raw, header) {
  const secret = process.env.IG_APP_SECRET;
  if (!secret || !header) return false;
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Meta calls this once when you save the webhook in the dashboard.
export async function GET(req) {
  const p = new URL(req.url).searchParams;
  if (
    p.get("hub.mode") === "subscribe" &&
    p.get("hub.verify_token") === process.env.WEBHOOK_VERIFY_TOKEN
  ) {
    return new Response(p.get("hub.challenge"), { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "comments") continue;
      const v = change.value ?? {};
      if (!v.id) continue;
      if (v.from?.id && v.from.id === entry.id) continue; // ignore my own comments

      const text = v.text ?? "";
      const match = matchesKeyword(text);

      const isNew = await claimComment({
        id: v.id,
        username: v.from?.username ?? "",
        text,
        mediaId: v.media?.id ?? "",
        at: new Date().toISOString(),
        status: match ? "pending" : "no_match",
      });
      if (!isNew || !match) continue; // duplicate delivery or no keyword

      try {
        const dm = [process.env.DM_MESSAGE, process.env.DM_LINK]
          .filter(Boolean)
          .join("\n");
        await sendPrivateReply(entry.id, v.id, dm);
        await updateComment(v.id, { status: "sent" });
      } catch (e) {
        await updateComment(v.id, { status: "failed", error: String(e.message) });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
