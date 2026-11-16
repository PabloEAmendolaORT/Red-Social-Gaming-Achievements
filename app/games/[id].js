import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Page, Panel, Text, TextLink, Title, colors, layout } from "../../components/RetroUI";
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

    const unavailable = catalogId && isRestoringSession ? 'Cargando sesión…'
        : catalogId && !userId ? 'Iniciá sesión para ver el juego.'
        : catalogId && !currentCatalog ? 'Cargando juego…'
        : catalogId && currentCatalog.error ? 'No se pudo cargar el juego.'
        : !game ? 'Juego no encontrado.' : null;

    if (unavailable) {
        return (
            <Page>
                <Text>{unavailable}</Text>
                <TextLink href="/library">Volver a mi biblioteca</TextLink>
            </Page>
        );
    }

    const achievementCount = raGameId ? progress?.unlocked : game.unlockedAchievements;
    const achievementTotal = raGameId ? progress?.total : game.totalAchievements;
    const percentage = achievementTotal > 0
        ? Math.min(100, Math.max(0, Math.round(achievementCount / achievementTotal * 100)))
        : null;

    return (
        <Page>
            <TextLink href="/library">← Mi biblioteca</TextLink>
            <View style={styles.header}>
                {game.system ? <Text tone="meta">{game.system}</Text> : null}
                <Title>{game.title}</Title>
            </View>
            <Panel>
                <Text tone="heading" accessibilityRole="header">Tu progreso</Text>
                {raGameId && isRestoringSession ? (
                    <Text tone="muted">Cargando sesión…</Text>
                ) : raGameId && !userId ? (
                    <TextLink href="/login">Iniciá sesión para ver tu progreso.</TextLink>
                ) : raGameId && progressMessage ? (
                    <Text>{progressMessage}</Text>
                ) : raGameId && !progress ? (
                    <Text tone="muted">Cargando progreso…</Text>
                ) : achievementTotal === 0 ? (
                    <Text tone="muted">Este juego no tiene logros disponibles.</Text>
                ) : (
                    <>
                        <View style={styles.progressCaption}>
                            <Text>{achievementCount} de {achievementTotal} logros desbloqueados</Text>
                            {percentage !== null && <Text tone="meta">{percentage} %</Text>}
                        </View>
                        {percentage !== null && (
                            <View
                                accessibilityRole="progressbar"
                                accessibilityLabel="Logros desbloqueados"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={percentage}
                                style={styles.track}
                            >
                                <View style={[styles.fill, { width: `${percentage}%` }]} />
                            </View>
                        )}
                    </>
                )}
            </Panel>
            {userId && raGameId && !isRestoringSession ? (
                <Panel>
                    <Text tone="heading" accessibilityRole="header">Ranking del juego</Text>
                    {!currentRanking ? (
                        <Text tone="muted">Cargando ranking…</Text>
                    ) : currentRanking.error ? (
                        <Text tone="error">No se pudo cargar el ranking.</Text>
                    ) : currentRanking.rows.length === 0 ? (
                        <Text tone="muted">Todavía no hay partidas con progreso registrado.</Text>
                    ) : currentRanking.rows.map((row, index) => (
                        <View key={index} style={[styles.rankingRow, row.is_me && styles.currentPlayer]}>
                            <Text tone="meta" style={styles.position}>{row.ranking_position}.</Text>
                            <Text style={styles.player}>{row.player_name}{row.is_me ? ' (vos)' : ''}</Text>
                            <Text tone="muted">{row.unlocked} de {row.total}</Text>
                            <Text tone="meta" style={styles.score}>{Number(row.percentage).toLocaleString('es-AR')} %</Text>
                        </View>
                    ))}
                </Panel>
            ) : null}
        </Page>
    );
}

const styles = StyleSheet.create({
    header: { gap: 8 },
    progressCaption: { ...layout.row, justifyContent: 'space-between' },
    track: { backgroundColor: colors.input, height: 10, borderRadius: 5, overflow: 'hidden' },
    fill: { backgroundColor: colors.accent, height: '100%', borderRadius: 5 },
    rankingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, backgroundColor: colors.input, borderRadius: 8, borderWidth: 1, borderColor: colors.line },
    currentPlayer: { backgroundColor: colors.highlight, borderColor: colors.highlightLine },
    position: { minWidth: 32 },
    player: { flex: 1 },
    score: { minWidth: 66, textAlign: 'right' },
});
