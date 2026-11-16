import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { getGameById } from "../../services/gameService";
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getRaProgress, getGameRanking, getRaGame } from '../../services/raService';

export default function GameDetails() {
    const { id } = useLocalSearchParams();
    const { user, isRestoringSession } = useContext(AuthContext);
    const userId = user?.id;
    const catalogId = typeof id === 'string' && /^ra-[1-9]\d*$/.test(id)
        ? Number(id.slice(3))
        : null;
    const [catalogResult, setCatalogResult] = useState(null);

    useEffect(() => {
        if (isRestoringSession || !userId || !catalogId) return;

        let ignore = false;

        async function loadGame() {
            const { data, error } = await getRaGame(catalogId);

            if (!ignore) {
                setCatalogResult({ userId, catalogId, data, error });
            }
        }

        loadGame();
        return () => { ignore = true; };
    }, [catalogId, isRestoringSession, userId]);

    const currentCatalog = catalogResult?.catalogId === catalogId &&
        catalogResult?.userId === userId ? catalogResult : null;

    const game = catalogId
        ? currentCatalog?.data && {
            title: currentCatalog.data.title,
            raGameId: currentCatalog.data.ra_game_id,
        }
        : getGameById(id);
        const raGameId = game?.raGameId;
    const [progress, setProgress] = useState(null);
    const [progressMessage, setProgressMessage] = useState('');

    useEffect(() => {
        setProgress(null);
        setProgressMessage('');

        if (isRestoringSession || !userId || !raGameId) return;

        let ignore = false;

        async function loadProgress() {
            const { data, error } = await getRaProgress(raGameId);
            if (ignore) return;

            if (error?.context?.status === 404) {
                setProgressMessage('Asociá tu cuenta de RetroAchievements en Perfil.');
            } else if (error) {
                setProgressMessage('No se pudo cargar el progreso.');
            } else {
                setProgress(data);
            }
        }

        loadProgress();

        return () => {
            ignore = true;
        };
    }, [raGameId, userId, isRestoringSession]);

    const [ranking, setRanking] = useState(null);

    useEffect(() => {
        if (isRestoringSession || !userId || !raGameId) return;

        let ignore = false;

        async function loadRanking() {
            try {
                const { data, error } = await getGameRanking(raGameId);
                if (error) throw error;

                if (!ignore) setRanking({ userId, raGameId, rows: data ?? [] });
            } catch {
                if (!ignore) setRanking({ userId, raGameId, error: true });
            }
        }

        loadRanking();
        return () => { ignore = true; };
    }, [isRestoringSession, userId, raGameId]);

    const currentRanking = ranking?.userId === userId && ranking?.raGameId === raGameId
        ? ranking
        : null;

        if (catalogId && isRestoringSession) return <Text>Cargando sesión…</Text>;
        if (catalogId && !userId) return <Text>Iniciá sesión para ver el juego.</Text>;
        if (catalogId && !currentCatalog) return <Text>Cargando juego…</Text>;
        if (catalogId && currentCatalog?.error) return <Text>No se pudo cargar el juego.</Text>;

    if (!game){
        return <Text>Juego no encontrado</Text>
    }
    return (
        <View>
            <Text>Detalles del juego {game.title}</Text>
            {game.system ? <Text>Sistema: {game.system}</Text> : null}
            {!raGameId ? (
                <Text>Logros desbloqueados: {game.unlockedAchievements} de {game.totalAchievements}</Text>
            ) : isRestoringSession ? (
                <Text>Cargando sesión…</Text>
            ) : !userId ? (
                <Text>Iniciá sesión para ver tu progreso.</Text>
            ) : progressMessage ? (
                <Text>{progressMessage}</Text>
            ) : progress ? (
                <Text>Logros desbloqueados: {progress.unlocked} de {progress.total}</Text>
            ) : (
                <Text>Cargando progreso…</Text>
            )}
            {userId && raGameId && !isRestoringSession ? (
                <View>
                    <Text>Ranking del juego</Text>
                    {!currentRanking ? (
                        <Text>Cargando ranking…</Text>
                    ) : currentRanking.error ? (
                        <Text>No se pudo cargar el ranking.</Text>
                    ) : currentRanking.rows.length === 0 ? (
                        <Text>Todavía no hay partidas con progreso registrado.</Text>
                    ) : currentRanking.rows.map((row, index) => (
                        <Text key={index}>
                            {row.ranking_position}. {row.player_name}{row.is_me ? ' (vos)' : ''}
                            {' · '}{row.unlocked} de {row.total}{' · '}
                            {Number(row.percentage).toLocaleString('es-AR')} %
                        </Text>
                    ))}
                </View>
            ) : null}
        </View>
    )

};