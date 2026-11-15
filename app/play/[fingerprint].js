import { useContext, useEffect, useState, useRef } from 'react';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View, Button } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { getRom } from '../../services/romStorage';
import { sendRaEmulatorRequest, finishPlaySession, startPlaySession } from '../../services/raService';

export default function Play() {
    const { fingerprint } = useLocalSearchParams();
    const { user, isRestoringSession } = useContext(AuthContext);
    const userId = user?.id;
    const [readyMessage, setReadyMessage] = useState(null);
    const [result, setResult] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [exitError, setExitError] = useState('');
    const iframeRef = useRef(null);
    const initialProgress = useRef(null);
    const sessionStart = useRef(null);
    const exitPending = useRef(false);
    const router = useRouter();

    useEffect(() => {
        if (isRestoringSession || !userId || typeof fingerprint !== 'string') return;

        let ignore = false;

        async function loadRom() {
            try {
                const rom = await getRom(userId, fingerprint);
                if (!ignore) setResult({ userId, fingerprint, rom });
            } catch {
                if (!ignore) setResult({ userId, fingerprint, error: true });
            }
        }

        loadRom();
        return () => { ignore = true; };
    }, [userId, fingerprint, isRestoringSession]);

    useEffect(() => {
        async function handleEmulatorMessage(event) {
            if (event.origin !== window.location.origin) return;
            if (event.source !== iframeRef.current?.contentWindow) return;
            if (event.data?.type === 'skyemu-ra-request') {
                const { requestId, body } = event.data;
                const frameWindow = event.source;

                if (typeof requestId !== 'string' || typeof body !== 'string') return;

                let result;

                try {
                    result = await sendRaEmulatorRequest(body);
                } catch {
                    result = { status: 502, body: '' };
                }

                if (frameWindow !== iframeRef.current?.contentWindow) return;

                frameWindow.postMessage(
                    { type: 'skyemu-ra-response', requestId, ...result },
                    event.origin
                );
                return;
            }
            if (event.data?.type === 'skyemu-sync-result') {
                if (!exitPending.current) return;
                exitPending.current = false;

                if (event.data.ok !== true) {
                    setIsSyncing(false);
                    setExitError('No se pudo sincronizar la partida. Volvé a intentar.');
                    return;
                }

                const frameWindow = event.source;
                const before = initialProgress.current;
                const params = { playedRom: fingerprint };

                if (before?.sessionId) {
                    try {
                        const { data, error } = await finishPlaySession(before.sessionId);
                        if (error) throw error;

                        if (data?.status === 'complete' && Array.isArray(data.newUnlockedIds)) {
                            params.newAchievements = String(data.newUnlockedIds.length);
                        }
                    } catch {
                        console.warn('No se pudo confirmar el cierre de la sesión.');
                    }
                }

                if (frameWindow !== iframeRef.current?.contentWindow) return;

                setIsSyncing(false);
                router.replace({ pathname: '/', params });
                return;
            }

            if (event.data?.type !== 'skyemu-ready') return;

            setReadyMessage((previous) =>
                previous?.source === event.source ? previous : { source: event.source }
            );
        }

        window.addEventListener('message', handleEmulatorMessage);
        return () => window.removeEventListener('message', handleEmulatorMessage);
    }, [router]);

    const current = result && result.userId === userId && result.fingerprint === fingerprint
    ? result
    : null;

    const file = current?.rom?.file;

    useEffect(() => {
        const frameWindow = iframeRef.current?.contentWindow;

        if (!userId || !file || !frameWindow || readyMessage?.source !== frameWindow) return;

        let ignore = false;
        initialProgress.current = null;

        async function startGame() {
            try {
                const start = sessionStart.current;

                if (start?.frameWindow !== frameWindow || start?.userId !== userId ||
                    start?.fingerprint !== fingerprint) {
                    sessionStart.current = {
                        frameWindow,
                        userId,
                        fingerprint,
                        request: startPlaySession(fingerprint),
                    };
                }

                const { data, error } = await sessionStart.current.request;
                if (error) throw error;

                if (!ignore && data?.sessionId && Array.isArray(data.unlockedIds)) {
                    initialProgress.current = {
                        sessionId: data.sessionId,
                        gameId: data.gameId,
                        unlockedIds: data.unlockedIds,
                    };
                }
            } catch {
                if (!ignore) console.info('No se pudo registrar el inicio de la partida.');
            }

            if (ignore || frameWindow !== iframeRef.current?.contentWindow) return;

            frameWindow.postMessage(
                { type: 'skyemu-load', file },
                window.location.origin
            );
        }

        startGame();
        return () => { ignore = true; };
    }, [file, readyMessage, userId, fingerprint]);

    function handleExit() {
        if (exitPending.current) return;

        const frameWindow = iframeRef.current?.contentWindow;

        if (!frameWindow || readyMessage?.source !== frameWindow) {
            router.replace('/');
            return;
        }

        exitPending.current = true;
        setExitError('');
        setIsSyncing(true);

        frameWindow.postMessage(
            { type: 'skyemu-sync-request' },
            window.location.origin
        );
    }

    if (isRestoringSession) return <Text>Cargando sesión…</Text>;
    if (!userId) return <Link href="/login">Iniciá sesión para jugar</Link>;
    if (typeof fingerprint !== 'string') return <Text>ROM inválida.</Text>;

    return (
        <View>
            <Button
                title={isSyncing ? 'Sincronizando…' : 'Volver a la biblioteca'}
                onPress={handleExit}
                disabled={isSyncing}
            />
            {exitError ? <Text>{exitError}</Text> : null}
            {!current ? <Text>Cargando ROM…</Text> : null}
            {current?.error ? <Text>No se pudo leer la ROM.</Text> : null}
            {current?.rom === null ? <Text>Seleccioná la ROM en este navegador.</Text> : null}
            {current?.rom ? <Text>ROM lista: {current.rom.file.name}</Text> : null}
            {current?.rom ? (
                <iframe
                    title="Emulador SkyEmu"
                    src={`/skyemu.html?account=${encodeURIComponent(userId)}`}
                    ref={iframeRef}
                    style={{ width: '100%, height: 480, border: 0 '}}
                />
            ) : null}
        </View>
    );
}