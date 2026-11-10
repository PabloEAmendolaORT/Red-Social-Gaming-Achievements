import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { useState, useContext } from 'react';
import { Link } from 'expo-router';
import { getGames } from '../services/gameService';
import { GameCard } from '../components/GameCard';
import { AuthContext } from '../context/AuthContext';
import { saveRom } from '../services/romStorage';
import { Button } from 'react-native';

export default function App() {
  
  const [selectedRom, setSelectedRom] = useState(null);
  const [romError, setRomError] = useState('');
  const { user, isRestoringSession } = useContext(AuthContext);
  const [isSavingRom, setIsSavingRom] = useState(false);
  const [romMessage, setRomMessage] = useState('');

  function handleRomChange(event) {
      const input = event.currentTarget;
      const file = input.files?.[0] ?? null;

      setRomError('');
      setSelectedRom(null);

      if (!file) return;

      if (!/\.(gb|gbc|gba)$/i.test(file.name) || file.size === 0) {
          setRomError('Elegí un archivo .gb, .gbc o .gba que no esté vacío.');
          input.value = '';
          return;
      }

      setSelectedRom(file);
  }

  async function handleSaveRom() {
    if (isRestoringSession || !user || !selectedRom || isSavingRom) return;
    
    setRomError('');
    setRomMessage('');
    setIsSavingRom(true);
    
    try {
      const savedRom = await saveRom(user.id, selectedRom);
      setRomMessage(`ROM guardada correctamente: ${savedRom.file.name}`);
    } catch {
      setRomError('No se pudo guardar la ROM.');
    } finally {
      setIsSavingRom(false);
    }

  }

  return (
    <View style={styles.container}>
      <Text>Biblioteca de juegos</Text>

      <StatusBar style="auto" />

      <input
        type="file"
        accept=".gb,.gbc,.gba"
        aria-label="Seleccionar una ROM"
        onChange={handleRomChange}
      />
      {selectedRom ? <Text>ROM seleccionada: {selectedRom.name}</Text> : null}

      <Button
        title={isSavingRom ? 'Guardando ROM...' : 'Guardar ROM'}
        onPress={handleSaveRom}
        disabled={isRestoringSession || !user || !selectedRom || isSavingRom}
      />
      {romMessage ? <Text>{romMessage}</Text> : null}
      
      {romError ? <Text>{romError}</Text> : null}

      <FlatList
        data={getGames()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GameCard game={item} />
        )}
      />
      <Link href="/profile">Perfil de usuario</Link>
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

