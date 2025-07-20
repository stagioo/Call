import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { count, error } = await supabase
      .from("waitlist")
      .select("id", { count: "exact", head: true });

    if (error) {
      console.error("Error getting waitlist count:", error);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (error) {
    console.error("Error getting waitlist count:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
