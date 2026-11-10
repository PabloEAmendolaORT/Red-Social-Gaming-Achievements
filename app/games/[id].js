import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { getGameById } from "../../services/gameService";
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getRaProgress } from '../../services/raService';

export default function GameDetails() {
    const { id } = useLocalSearchParams();
    const game = getGameById(id);
    const { user, isRestoringSession } = useContext(AuthContext);
    const userId = user?.id;
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

    if (!game){
        return <Text>Juego no encontrado</Text>
    }
    return (
        <View>
            <Text>Detalles del juego {game.title}</Text>
            <Text>Sistema: {game.system}</Text>
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
        </View>
    )

};