import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RegisterPayload = {
  selectedId: string;
  selectedNumber: string;
  form: {
    full_name: string;
    age: string;
    nrc: string;
    address: string;
    father_name: string;
    job: string;
  };
  deviceId: string;
  selfieUrl: string;
  nrcFrontUrl: string;
  nrcBackUrl: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterPayload;

    const {
      selectedId,
      selectedNumber,
      form,
      deviceId,
      selfieUrl,
      nrcFrontUrl,
      nrcBackUrl,
    } = body;

    if (
      !selectedId ||
      !selectedNumber ||
      !deviceId ||
      !form?.full_name?.trim() ||
      !form?.age?.trim() ||
      !form?.nrc?.trim() ||
      !form?.address?.trim() ||
      !form?.father_name?.trim() ||
      !form?.job?.trim() ||
      !selfieUrl ||
      !nrcFrontUrl ||
      !nrcBackUrl
    ) {
      return NextResponse.json(
        { error: "Missing required registration data" },
        { status: 400 }
      );
    }

    const { data: existingOwnership, error: ownershipCheckError } =
      await supabaseAdmin
        .from("ownership")
        .select("id")
        .eq("device_id", deviceId)
        .eq("active", true)
        .limit(1);

    if (ownershipCheckError) {
      return NextResponse.json(
        { error: `Ownership check failed: ${ownershipCheckError.message}` },
        { status: 500 }
      );
    }

    if (existingOwnership && existingOwnership.length > 0) {
      return NextResponse.json(
        { error: "This device already owns a SIM" },
        { status: 400 }
      );
    }

    const { data: currentNumber, error: numberCheckError } =
      await supabaseAdmin
        .from("numbers")
        .select("id, status, number")
        .eq("id", selectedId)
        .single();

    if (numberCheckError) {
      return NextResponse.json(
        { error: `Number check failed: ${numberCheckError.message}` },
        { status: 500 }
      );
    }

    if (!currentNumber || currentNumber.status !== "available") {
      return NextResponse.json(
        { error: "This SIM is no longer available" },
        { status: 400 }
      );
    }

    const registrationPayload = {
      number: selectedNumber,
      full_name: form.full_name.trim(),
      age: form.age.trim(),
      nrc: form.nrc.trim(),
      address: form.address.trim(),
      father_name: form.father_name.trim(),
      job: form.job.trim(),
      device_id: deviceId,
      selfie_url: selfieUrl,
      nrc_front_url: nrcFrontUrl,
      nrc_back_url: nrcBackUrl,
      status: "approved",
    };

    const { data: registrationInsert, error: registrationError } =
      await supabaseAdmin
        .from("sim_registrations")
        .insert([registrationPayload])
        .select("id")
        .single();

    if (registrationError) {
      return NextResponse.json(
        { error: `Registration save failed: ${registrationError.message}` },
        { status: 500 }
      );
    }

    const ownershipPayload = {
      user_id: null,
      number_id: selectedId,
      owner_name: form.full_name.trim(),
      owner_nrc: form.nrc.trim(),
      owner_note: null,
      device_id: deviceId,
      registration_id: registrationInsert.id,
      active: true,
    };

    const { error: ownershipError } = await supabaseAdmin
      .from("ownership")
      .insert([ownershipPayload]);

    if (ownershipError) {
      return NextResponse.json(
        { error: `Ownership save failed: ${ownershipError.message}` },
        { status: 500 }
      );
    }

    const { error: updateNumberError } = await supabaseAdmin
      .from("numbers")
      .update({ status: "sold" })
      .eq("id", selectedId);

    if (updateNumberError) {
      return NextResponse.json(
        { error: `Number update failed: ${updateNumberError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      registrationId: registrationInsert.id,
    });
  } catch (error) {
    console.error("sim-register route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}