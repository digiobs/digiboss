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
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Delete the profile first (cascade will handle user_clients).
      await supabase.from("profiles").delete().eq("id", userId);

      // Then delete the auth user.
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ status: "deleted", userId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── CREATE ──────────────────────────────────────────────
    const email: string | undefined = body?.email?.trim();
    const fullName: string | undefined = body?.full_name?.trim();
    const role: string = body?.role ?? "team_member";
    const password: string | undefined = body?.password?.trim();

    if (!email || !fullName) {
      return new Response(
        JSON.stringify({ error: "email and full_name are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!password || password.length < 6) {
      return new Response(
        JSON.stringify({ error: "password must be at least 6 characters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
    console.error("[invite-team-member] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
