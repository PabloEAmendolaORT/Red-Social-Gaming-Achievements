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

export function getRaLink(userId) {
    return supabase
        .from('ra_links')
        .select('ra_ulid, ra_username')
        .eq('user_id', userId)
        .maybeSingle();
}

export function getRaProgress(gameId) {
    return supabase.functions.invoke('ra-progress', {
        body: { gameId },
    });
}

export function searchRaGames(consoleId, title) {
    return supabase
        .from('ra_game_catalog')
        .select('ra_game_id, title')
        .eq('console_id', consoleId)
        .ilike('title', `%${title.trim()}%`)
        .order('title')
        .limit(20);
}