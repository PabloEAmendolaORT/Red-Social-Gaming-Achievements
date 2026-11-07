import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { getGames } from '../services/gameService';
import { GameCard } from '../components/GameCard';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Biblioteca de juegos</Text>
      <StatusBar style="auto" />
      <FlatList
        data={getGames()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GameCard game={item} />
        )}
      />
    </View>
  )       
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

