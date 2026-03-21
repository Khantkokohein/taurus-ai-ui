import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function generateTaurusNumber() {
  const random = Math.floor(1000000 + Math.random() * 9000000);
  return `+70 20 ${random}`;
}

export async function GET() {
  try {
    const phoneNumber = generateTaurusNumber();

    const { data, error } = await supabaseAdmin
      .from("numbers")
      .insert([
        {
          phone_number: phoneNumber,
          status: "available",
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      number: data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}