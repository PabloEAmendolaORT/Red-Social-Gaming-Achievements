import { View } from 'react-native';
import { Link } from 'expo-router';

export function GameCard({ game }) {
  return (
    <View>
        <Link href={`/games/${game.id}`}>{game.title}</Link>
    </View>
    );
};
        