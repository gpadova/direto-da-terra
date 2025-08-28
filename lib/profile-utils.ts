import { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "./supabase/admin";

export interface CreateProfileParams {
    id: string;
    email: string;
    full_name?: string;
    user_type: "consumer" | "producer" | "restaurant";
}

export async function createProfile(
    supabase: SupabaseClient,
    params: CreateProfileParams
) {
    const { data, error } = await supabase
        .from("profiles")
        .insert({
            id: params.id,
            email: params.email,
            full_name: params.full_name || "",
            user_type: params.user_type,
        })
        .select()
        .single();

    return { data, error };
}

export async function getOrCreateProfile(
    supabase: SupabaseClient,
    userId: string,
    fallbackData?: Omit<CreateProfileParams, "id">
) {
    // First, try to get the existing profile
    const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (existingProfile) {
        return { data: existingProfile, error: null };
    }

    // If profile doesn't exist and we have fallback data, create it
    if (fallbackData) {
        // Use admin client to bypass RLS for profile creation
        const adminClient = createAdminClient();
        return await createProfile(adminClient, {
            id: userId,
            ...fallbackData,
        });
    }

    // Return the original fetch error if no fallback data provided
    return { data: null, error: fetchError };
}
