import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";

export default function GameDetails() {
    const { id } = useLocalSearchParams();
    return <Text>Detalles del juego {id}</Text>
};