import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function generateSuffix(): string {
  return Math.floor(Math.random() * 10000000)
    .toString()
    .padStart(7, "0");
}

function detectPattern(s: string) {
  const set = new Set(s);

  if (set.size === 1) return "7-same";
  if (s === s.split("").reverse().join("")) return "mirror";
  if (/(\d)\1{3}/.test(s)) return "repeating";

  return "general";
}

export async function POST() {
  let suffix = "";
  let exists = true;

  while (exists) {
    suffix = generateSuffix();

    const { data } = await supabase
      .from("numbers")
      .select("id")
      .eq("suffix_7", suffix)
      .limit(1);

    exists = !!(data && data.length > 0);
  }

  const fullNumber = `+7020${suffix}`;

  return NextResponse.json({
    number: fullNumber,
    suffix_7: suffix,
    pattern: detectPattern(suffix),
  });
}