import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/supabase/db";
import type { Profile } from "@/lib/types";

/**
 * Devuelve el perfil del usuario autenticado (Clerk), creándolo en Supabase
 * si es su primera vez. Devuelve null si no hay sesión.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = db();

  // ¿Existe ya el perfil?
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (existing) return existing as Profile;

  // Primera vez: crear el perfil con los datos de Clerk
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;

  const { data: created } = await supabase
    .from("profiles")
    .insert({ id: userId, email, full_name: fullName })
    .select("*")
    .single();

  return (created as Profile) ?? null;
}

/** Exige sesión; redirige a /sign-in si no hay. */
export async function requireUser(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  return profile;
}

/** Exige rol admin. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}

/** Devuelve el user id de Clerk o redirige a /sign-in. */
export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}
