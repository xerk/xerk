import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Back to the public site; the private dashboard path isn't advertised anywhere.
  return NextResponse.redirect(new URL("/", req.nextUrl.origin), { status: 303 });
}
