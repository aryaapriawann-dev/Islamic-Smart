import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function POST(request: Request) {
  try {
    let startDate = "";
    let endDate = "";
    let format = "csv";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      startDate = body?.startDate || "";
      endDate = body?.endDate || "";
      format = body?.format || "csv";
    } else {
      const formData = await request.formData();
      startDate = (formData.get("startDate") as string) || "";
      endDate = (formData.get("endDate") as string) || "";
      format = (formData.get("format") as string) || "csv";
    }

    if (!startDate || !endDate) {
      const today = new Date().toISOString().split("T")[0];
      startDate = startDate || today;
      endDate = endDate || today;
    }

    let reportRows: { date: string; prayer: string; count: number }[] = [];

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase
        .from("visitor_counts")
        .select("timestamp, count, prayer_time_label")
        .gte("timestamp", `${startDate}T00:00:00Z`)
        .lte("timestamp", `${endDate}T23:59:59Z`)
        .order("timestamp", { ascending: true });

      if (data && data.length > 0) {
        const grouped: Record<string, Record<string, number>> = {};
        for (const row of data) {
          const date = row.timestamp?.split("T")[0] || startDate;
          const prayer = row.prayer_time_label || "LAINNYA";
          if (!grouped[date]) grouped[date] = {};
          grouped[date][prayer] = (grouped[date][prayer] || 0) + (row.count || 0);
        }

        for (const [date, prayers] of Object.entries(grouped)) {
          for (const [prayer, count] of Object.entries(prayers)) {
            reportRows.push({ date, prayer, count });
          }
        }
      }
    }

    if (reportRows.length === 0) {
      reportRows.push({ date: startDate, prayer: "-", count: 0 });
    }

    if (format === "html") {
      const rows = reportRows
        .map(
          (r) =>
            `<tr><td style="padding:8px;border:1px solid #ddd;">${r.date}</td><td style="padding:8px;border:1px solid #ddd;">${r.prayer}</td><td style="padding:8px;border:1px solid #ddd;text-align:right;">${r.count}</td></tr>`
        )
        .join("\n");

      const totalCount = reportRows.reduce((s, r) => s + r.count, 0);

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Laporan Kunjungan Masjid Islamic Smart Assistance</title>
  <style>
    body { font-family: sans-serif; padding: 30px; color: #111; }
    h1 { color: #047857; margin-bottom: 4px; }
    p { color: #666; font-size: 14px; margin-top: 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #047857; color: white; padding: 10px; border: 1px solid #047857; text-align: left; }
    .footer { margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
    .total { margin-top: 16px; font-weight: bold; font-size: 15px; }
  </style>
</head>
<body>
  <h1>Islamic Smart Assistance — Laporan Kunjungan Jamaah Masjid</h1>
  <p>Periode: <strong>${startDate}</strong> s.d. <strong>${endDate}</strong></p>

  <table>
    <thead>
      <tr>
        <th>Tanggal</th>
        <th>Waktu Sholat</th>
        <th style="text-align:right;">Jumlah Jamaah</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <p class="total">Total Jamaah: ${totalCount.toLocaleString("id-ID")}</p>

  <div class="footer">
    Dicetak otomatis oleh Sistem Asisten Digital Masjid — Islamic Smart Assistance
  </div>
</body>
</html>`;

      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename=laporan-kunjungan-${startDate}-${endDate}.html`,
        },
      });
    }

    const csvRows = reportRows
      .map((r) => `"${r.date}","${r.prayer}",${r.count}`)
      .join("\n");

    const csv = `"Tanggal","Waktu Sholat","Jumlah Jamaah"\n${csvRows}\n`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=laporan-kunjungan-${startDate}-${endDate}.csv`,
      },
    });
  } catch (err) {
    console.error("Report generation error:", err);
    return NextResponse.json({ error: "Gagal membuat laporan" }, { status: 500 });
  }
}
