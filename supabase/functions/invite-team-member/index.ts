import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase runtime secrets" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const action: string = body?.action ?? "create";

    // ── DELETE ──────────────────────────────────────────────
    if (action === "delete") {
      const userId: string | undefined = body?.userId;
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "userId is required for delete" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Delete the profile first (cascade will handle user_clients).
      await supabase.from("profiles").delete().eq("id", userId);

      // Then delete the auth user.
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ status: "deleted", userId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── SET PASSWORD (admin-initiated, no email) ────────────
    if (action === "set_password") {
      const userId: string | undefined = body?.userId;
      const newPassword: string | undefined = body?.password?.trim();
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "userId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (!newPassword || newPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: "password must be at least 6 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      });
      if (error) {
        console.error("[invite-team-member] updateUserById error:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ status: "password_updated", userId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── CREATE / INVITE ─────────────────────────────────────
    // Two sub-modes:
    //   - `method: 'password'` (default) → admin.createUser with an
    //     explicit initial password. No email is sent.
    //   - `method: 'invite'` → admin.inviteUserByEmail. Supabase sends
    //     the built-in invite email through whatever SMTP transport is
    //     configured in the Supabase dashboard (Authentication → SMTP).
    const email: string | undefined = body?.email?.trim();
    const fullName: string | undefined = body?.full_name?.trim();
    const role: string = body?.role ?? "team_member";
    const method: "password" | "invite" =
      body?.method === "invite" ? "invite" : "password";
    const password: string | undefined = body?.password?.trim();
    const redirectTo: string | undefined = body?.redirect_to?.trim();

    if (!email || !fullName) {
      return new Response(
        JSON.stringify({ error: "email and full_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (method === "invite") {
      // Send invite email — user sets their own password via the
      // magic link and lands on /reset-password.
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(
        email,
        {
          data: { full_name: fullName, role },
          redirectTo,
        },
      );

      if (error) {
        console.error("[invite-team-member] inviteUserByEmail error:", error);
        return new Response(
          JSON.stringify({ error: error.message, code: (error as { code?: string }).code }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          status: "invited",
          user: { id: data.user?.id, email: data.user?.email },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!password || password.length < 6) {
      return new Response(
        JSON.stringify({ error: "password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Create user via admin API. The on_auth_user_created trigger
    // auto-inserts the profiles row using raw_user_meta_data.
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification for team members.
      user_metadata: {
        full_name: fullName,
        role,
      },
    });

    if (error) {
      console.error("[invite-team-member] createUser error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        status: "created",
        user: { id: data.user.id, email: data.user.email },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[invite-team-member] unexpected error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
