import { supabase } from './supabaseClient';

export function saveProfile(userId, displayName) {
    return supabase
        .from('profiles')
        .upsert({ id: userId, display_name: displayName });
}

export function getProfile(userId) {
    return supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .maybeSingle();
}