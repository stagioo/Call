import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = emailSchema.safeParse(body);

    if (!result.success) {
      const errorMessage = result.error.errors[0]?.message;
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const emailNormalized = email.toLowerCase().trim();


    const { data: existing, error: selectError } = await supabase
      .from("waitlist")
      .select("id")
      .eq("email", emailNormalized)
      .maybeSingle();

    if (selectError) {
      console.error("Error checking existing email:", selectError);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { success: false, error: "This email is already on the waitlist" },
        { status: 400 }
      );
    }

  
    const { error: insertError } = await supabase
      .from("waitlist")
      .insert({ email: emailNormalized });

    if (insertError) {
      console.error("Error inserting email:", insertError);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error adding email to waitlist:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
