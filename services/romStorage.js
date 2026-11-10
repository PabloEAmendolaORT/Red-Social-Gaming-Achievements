function openRomDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('pnt2-rom-library', 1);

        request.onupgradeneeded = () => {
            const store = request.result.createObjectStore('roms', {
                keyPath: ['userId', 'fingerprint'],
            });

            store.createIndex('byUser', 'userId');
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveRom(userId, file) {
    const bytes = await file.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    const fingerprint = Array.from(
        new Uint8Array(hash),
        (byte) => byte.toString(16).padStart(2, '0')
    ).join('');

    const rom = { userId, fingerprint, file };
    const db = await openRomDatabase();

    try {
        return await new Promise((resolve, reject) => {
            const transaction = db.transaction('roms', 'readwrite');

            transaction.oncomplete = () => resolve(rom);
            transaction.onabort = () => {
                reject(transaction.error ?? new Error('No se pudo guardar la ROM.'));
            };

            transaction.objectStore('roms').put(rom);
        });
    } finally {
        db.close();
    }
}

export async function listRoms(userId) {
    const db = await openRomDatabase();

    try{
        return await new Promise((resolve, reject) => {
            const transaction = db.transaction('roms', 'readonly');
            const store = transaction.objectStore('roms');
            const request = store.index('byUser').getAll(userId);

            transaction.oncomplete = () => resolve(request.result);
            transaction.onabort = () => {
                reject(transaction.error ?? new Error('No se pudieron listar las ROMs.'));
            };
        });

    } finally {
        db.close();
    }
}

export async function getRom(userId, fingerprint) {
    const db = await openRomDatabase();

    try {
        return await new Promise((resolve, reject) => {
            const transaction = db.transaction('roms', 'readonly');
            const store = transaction.objectStore('roms');
            const request = store.get([userId, fingerprint]);

            transaction.oncomplete = () => resolve(request.result ?? null);
            transaction.onabort = () => {
                reject(transaction.error ?? new Error('No se pudo leer la ROM.'));
            };
        });
    } finally {
        db.close();
    }
}