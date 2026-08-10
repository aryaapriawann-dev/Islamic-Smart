import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export async function logAttireCheck(result_status: string, persen_aurat: number, mode: string) {
  if (!supabase) return;
  try {
    await supabase.from("attire_logs").insert([
      {
        result_status,
        persen_aurat,
        mode,
      },
    ]);
  } catch (err) {
    console.error("Error logging attire check to Supabase:", err);
  }
}

export async function logRakaatSession(
  session_id: string,
  prayer_type: string,
  max_rakaat: number,
  detected_rakaat: number,
  exceeded: boolean
) {
  if (!supabase) return;
  try {
    await supabase.from("rakaat_sessions").insert([
      {
        session_id,
        prayer_type,
        max_rakaat,
        detected_rakaat,
        exceeded,
      },
    ]);
  } catch (err) {
    console.error("Error logging rakaat session to Supabase:", err);
  }
}

