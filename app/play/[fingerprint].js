import { useContext, useEffect, useState } from 'react';
import { Link, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { getRom } from '../../services/romStorage';

export default function Play() {
    const { fingerprint } = useLocalSearchParams();
    const { user, isRestoringSession } = useContext(AuthContext);
    const userId = user?.id;
    const [result, setResult] = useState(null);

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

    if (isRestoringSession) return <Text>Cargando sesión…</Text>;
    if (!userId) return <Link href="/login">Iniciá sesión para jugar</Link>;
    if (typeof fingerprint !== 'string') return <Text>ROM inválida.</Text>;

    const current = result?.userId === userId && result.fingerprint === fingerprint
        ? result
        : null;

    return (
        <View>
            <Link href="/">Volver a la biblioteca</Link>
            {!current ? <Text>Cargando ROM…</Text> : null}
            {current?.error ? <Text>No se pudo leer la ROM.</Text> : null}
            {current?.rom === null ? <Text>Seleccioná la ROM en este navegador.</Text> : null}
            {current?.rom ? <Text>ROM lista: {current.rom.file.name}</Text> : null}
        </View>
    );
}