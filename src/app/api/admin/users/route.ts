import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Helper: verify the request comes from a logged-in admin ──────────────────

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;
  return user;
}

// ── POST /api/admin/users — create a new driver (or admin) ───────────────────

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { email, password, fullName, role = "driver" } = body as {
    email: string;
    password: string;
    fullName: string;
    role?: "driver" | "admin";
  };

  if (!email || !password || !fullName) {
    return NextResponse.json({ error: "email, password and fullName are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: fullName, role },
    email_confirm: true, // skip email confirmation — admin sets password directly
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // The DB trigger (handle_new_user) auto-creates the profile.
  // But we upsert here as a safety net in case the trigger races.
  await adminClient.from("profiles").upsert(
    {
      id: data.user.id,
      email,
      full_name: fullName,
      role,
    },
    { onConflict: "id" }
  );

  return NextResponse.json({ user: { id: data.user.id, email, fullName, role } });
}

// ── PATCH /api/admin/users — update password and/or name ────────────────────

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, password, fullName } = body as {
    userId: string;
    password?: string;
    fullName?: string;
  };

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (password && password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Update auth record (password lives here)
  if (password) {
    const { error } = await adminClient.auth.admin.updateUserById(userId, { password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  // Update profile (full_name lives here)
  if (fullName) {
    await adminClient
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId);
  }

  return NextResponse.json({ success: true });
}

// ── DELETE /api/admin/users — delete a driver account ────────────────────────

export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { userId } = await req.json() as { userId: string };
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Profile is cascade-deleted by the FK constraint

  return NextResponse.json({ success: true });
}
