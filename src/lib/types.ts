export interface VisitorCount {
  id?: string;
  timestamp: string;
  count: number;
  prayer_time_label?: string | null;
  device_id?: string | null;
}

export interface AttireLog {
  id?: string;
  timestamp: string;
  result_status: string;
  persen_aurat?: number | null;
  mode?: string | null;
}

export interface RakaatSession {
  id?: string;
  session_id: string;
  prayer_type: string;
  max_rakaat: number;
  detected_rakaat: number;
  exceeded: boolean;
  timestamp?: string;
}

export type PrayerType = "SUBUH" | "ZUHUR" | "ASHAR" | "MAGHRIB" | "ISYA";

export interface AttendanceReportRow {
  date: string;
  prayer_time: string | null;
  count: number;
}
