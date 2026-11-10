import { useContext, useEffect, useState, useRef } from 'react';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View, Button } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { getRom } from '../../services/romStorage';

export default function Play() {
    const { fingerprint } = useLocalSearchParams();
    const { user, isRestoringSession } = useContext(AuthContext);
    const userId = user?.id;
    const [result, setResult] = useState(null);
    const iframeRef = useRef(null);
    const [readyMessage, setReadyMessage] = useState(null);
    const router = useRouter();
    const exitPending = useRef(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [exitError, setExitError] = useState('');

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
        function handleEmulatorMessage(event) {
            if (event.origin !== window.location.origin) return;
            if (event.source !== iframeRef.current?.contentWindow) return;
            if (event.data?.type === 'skyemu-sync-result') {
            if (!exitPending.current) return;

            exitPending.current = false;
            setIsSyncing(false);

            if (event.data.ok === true) {
                router.replace('/');
            } else {
                setExitError('No se pudo sincronizar la partida. Volvé a intentar.');
            }

            return;
            }

            if (event.data?.type !== 'skyemu-ready') return;

            setReadyMessage({ source: event.source });

        }

        window.addEventListener('message', handleEmulatorMessage);
        return () => window.removeEventListener('message', handleEmulatorMessage);
    }, []);

    const current = result && result.userId === userId && result.fingerprint === fingerprint
    ? result
    : null;

    const file = current?.rom?.file;

    useEffect(() => {
        const frameWindow = iframeRef.current?.contentWindow;

        if (!file || !frameWindow || readyMessage?.source !== frameWindow) return;

        frameWindow.postMessage(
            { type: 'skyemu-load', file },
            window.location.origin
        );
    }, [file, readyMessage]);

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