import { NextResponse } from "next/server";

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

    const prayers = ["SUBUH", "ZUHUR", "ASHAR", "MAGHRIB", "ISYA"];
    const seedCounts: Record<string, number> = {
      SUBUH: 145,
      ZUHUR: 320,
      ASHAR: 210,
      MAGHRIB: 480,
      ISYA: 390,
    };

    if (format === "html") {
      const rows = prayers
        .map(
          (p) =>
            `<tr><td style="padding:8px;border:1px solid #ddd;">${startDate}</td><td style="padding:8px;border:1px solid #ddd;">${p}</td><td style="padding:8px;border:1px solid #ddd;text-align:right;">${seedCounts[p]}</td></tr>`
        )
        .join("\n");

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Laporan Kunjungan Masjid Ihsan.id</title>
  <style>
    body { font-family: sans-serif; padding: 30px; color: #111; }
    h1 { color: #047857; margin-bottom: 4px; }
    p { color: #666; font-size: 14px; margin-top: 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #047857; color: white; padding: 10px; border: 1px solid #047857; text-align: left; }
    .footer { margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
  </style>
</head>
<body>
  <h1>Ihsan.id — Laporan Kunjungan Jamaah Masjid</h1>
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

  <div class="footer">
    Dicetak otomatis oleh Sistem Asisten Digital Masjid — Ihsan.id
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

    // Default: CSV format
    const rows = prayers
      .map((p) => `"${startDate}","${p}",${seedCounts[p]}`)
      .join("\n");

    const csv = `"Tanggal","Waktu Sholat","Jumlah Jamaah"\n${rows}\n`;

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
