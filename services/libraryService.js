import { supabase } from './supabaseClient';

export function saveLibraryEntry({userId, fingerprint, file }) {
    return supabase.from('library_entries').upsert(
        {
            user_id:userId,
            rom_fingerprint:fingerprint,
            rom_name: file.name,
        },
        {
            onConflict: 'user_id,rom_fingerprint',
            ignoreDuplicates: true,
        }
    );
}

export function listLibraryEntries(userId) {
    return supabase
        .from('library_entries')
        .select('rom_fingerprint, rom_name, ra_game_id')
        .eq('user_id', userId);
}