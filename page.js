import { notFound } from "next/navigation";
import { listRecent } from "../lib/store.js";

export const dynamic = "force-dynamic";

const LABEL = {
  sent: ["મોકલાયું", "#1a7f37"],
  failed: ["નિષ્ફળ", "#c62828"],
  pending: ["પ્રક્રિયામાં", "#9a6700"],
  no_match: ["કીવર્ડ નથી", "#6e6e73"],
};

export default async function Page({ searchParams }) {
  const { key } = await searchParams;
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) notFound();

  const rows = await listRecent(50);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22 }}>છેલ્લી 50 કોમેન્ટ</h1>
      {rows.length === 0 && <p>હજી કોઈ કોમેન્ટ આવી નથી.</p>}
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: 8 }}>સમય (UTC)</th>
              <th style={{ padding: 8 }}>યુઝર</th>
              <th style={{ padding: 8 }}>કોમેન્ટ</th>
              <th style={{ padding: 8 }}>DM</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const [label, color] = LABEL[r.status] ?? [r.status, "#6e6e73"];
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid #eee", verticalAlign: "top" }}>
                  <td style={{ padding: 8, whiteSpace: "nowrap" }}>
                    {r.at?.slice(0, 16).replace("T", " ")}
                  </td>
                  <td style={{ padding: 8 }}>@{r.username}</td>
                  <td style={{ padding: 8 }}>{r.text}</td>
                  <td style={{ padding: 8, color, fontWeight: 600 }}>
                    {label}
                    {r.error && (
                      <div style={{ fontWeight: 400, fontSize: 12 }}>{r.error}</div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
