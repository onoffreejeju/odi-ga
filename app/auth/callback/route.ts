import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";
  const callbackError = searchParams.get("error");
  const callbackErrorDescription = searchParams.get("error_description");

  if (callbackError) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", callbackError);
    if (callbackErrorDescription) {
      url.searchParams.set("error_description", callbackErrorDescription);
    }
    return NextResponse.redirect(url);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_auth_code`);
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", "auth_callback_failed");
    url.searchParams.set("error_description", error.message);
    return NextResponse.redirect(url);
  }

  const user = data.user;

  if (user) {
    await supabase.from("users").upsert({
      id: user.id,
      name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "ODI:GA User",
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
    });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
