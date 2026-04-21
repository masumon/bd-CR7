import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "signup" | "magiclink" | "recovery" | "email" | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const safeRedirect = (path: string) => {
    if (!path.startsWith("/")) return "/dashboard";
    return path;
  };

  // Handle email confirmation / magic link / recovery (token_hash flow)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      // Recovery links should land on login so user can continue reset/login UI.
      const destination = type === "recovery" ? "/login?reset=verified" : safeRedirect(next);
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Handle OAuth code exchange (Google, GitHub, etc.)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeRedirect(next)}`);
    }
  }

  // Confirmation failed — send to login with error message
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
