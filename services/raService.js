import { supabase } from './supabaseClient';

export function searchRaProfile(username) {
    return supabase.functions.invoke('ra-profile', {
        body: { username },
    });
}