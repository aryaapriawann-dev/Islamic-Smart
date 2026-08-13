import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function GET() {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    let total_today = 0;
    let total_week = 0;
    let total_month = 0;
    const prayer_breakdown: Record<string, number> = {
      SUBUH: 0,
      ZUHUR: 0,
      ASHAR: 0,
      MAGHRIB: 0,
      ISYA: 0,
    };

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase
        .from("visitor_counts")
        .select("count, prayer_time_label, timestamp")
        .gte("timestamp", `${todayStr}T00:00:00.000Z`);

      if (data && data.length > 0) {
        for (const row of data) {
          const count = row.count || 0;
          total_today += count;
          const label = (row.prayer_time_label || "").toUpperCase();
          if (label in prayer_breakdown) {
            prayer_breakdown[label] += count;
          }
        }
      }
      total_week = total_today;
      total_month = total_today;
    }

    return NextResponse.json({
      total_today,
      total_week,
      total_month,
      prayer_breakdown,
    });
  } catch {
    return NextResponse.json(
      {
        total_today: 0,
        total_week: 0,
        total_month: 0,
        prayer_breakdown: {
          SUBUH: 0,
          ZUHUR: 0,
          ASHAR: 0,
          MAGHRIB: 0,
          ISYA: 0,
        },
      },
      { status: 200 }
    );
  }
}
