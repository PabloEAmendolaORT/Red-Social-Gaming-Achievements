import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { getGameById } from "../../services/gameService";

export default function GameDetails() {
    const { id } = useLocalSearchParams();
    const game = getGameById(id);
    if (!game){
        return <Text>Juego no encontrado</Text>
    }
    return (
        <View>
        <Text>Detalles del juego {game.title}</Text>
        <Text>Sistema: {game.system}</Text>
        <Text>Logros desbloqueados: {game.unlockedAchievements} de {game.totalAchievements}</Text>
        </View>
    )

};