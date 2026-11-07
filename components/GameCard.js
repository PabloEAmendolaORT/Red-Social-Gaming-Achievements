import { View, Text } from 'react-native';

export function GameCard({ game }) {
  return (
    <View>
        <Text>{game.title}</Text>
    </View>
    );
}
        