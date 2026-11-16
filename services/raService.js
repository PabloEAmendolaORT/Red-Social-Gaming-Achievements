import { supabase } from './supabaseClient';
import { md5 } from '@noble/hashes/legacy.js';
import { bytesToHex } from '@noble/hashes/utils.js';

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

export function startPlaySession(fingerprint) {
    return supabase.functions.invoke('ra-progress', {
        body: { action: 'start', fingerprint },
    });
}

export function finishPlaySession(sessionId) {
    return supabase.functions.invoke('ra-progress', {
        body: { action: 'finish', sessionId },
    });
}

export function listPendingPlaySessions(userId) {
    return supabase
        .from('play_sessions')
        .select('id, ra_game_id, ended_at')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('ended_at', { ascending: false });
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

export function resolveRaGameId(hash) {
    return supabase.functions.invoke('ra-emulator', {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ r: 'gameid', m: hash }).toString(),
    });
}

export async function getRaRomHash(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return bytesToHex(md5(bytes));
}

export async function sendRaEmulatorRequest(body) {
    const { data, error, response } = await supabase.functions.invoke(
        'ra-emulator',
        {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        }
    );

    if (!response) {
        return { status: 502, body: '' };
    }

    return {
        status: response.status,
        body: error ? await response.text() : JSON.stringify(data),
    };
}

export function getGameRanking(gameId) {
    return supabase.rpc('get_game_ranking', { p_ra_game_id: gameId });
}

export async function listPlayedGames(userId, raUlid) {
    const { data, error } = await supabase
        .from('play_sessions')
        .select('ra_game_id, total_unlocked, total_achievements, game:ra_game_catalog(title)')
        .eq('user_id', userId)
        .eq('ra_ulid', raUlid)
        .eq('status', 'complete')
        .not('progress_synced_at', 'is', null)
        .order('progress_synced_at', { ascending: false });
    if (error) return { data: null, error};

    const games = new Map();

    for (const session of data ?? []) {
        if (!games.has(session.ra_game_id)) {
            games.set(session.ra_game_id, session);
        }
    }

    return { data: Array.from(games.values()), error: null};
}

export function getRaGame(gameId) {
    return supabase
        .from('ra_game_catalog')
        .select('ra_game_id, title')
        .eq('ra_game_id', gameId)
        .maybeSingle();
}