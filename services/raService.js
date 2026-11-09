import { supabase } from './supabaseClient';

export function searchRaProfile(username) {
    return supabase.functions.invoke('ra-profile', {
        body: { username },
    });
}

export function linkRaProfile(ulid) {
    return supabase.functions.invoke('ra-profile', {
        body: { action: 'link', username: ulid },
    });
}