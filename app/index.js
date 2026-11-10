import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList, Button } from 'react-native';
import { useState, useContext, useEffect } from 'react';
import { Link } from 'expo-router';
import { getGames } from '../services/gameService';
import { GameCard } from '../components/GameCard';
import { AuthContext } from '../context/AuthContext';
import { saveRom, listRoms } from '../services/romStorage';
import { saveLibraryEntry, listLibraryEntries } from '../services/libraryService';

export default function App() {
  
  const [selectedRom, setSelectedRom] = useState(null);
  const [romError, setRomError] = useState('');
  const { user, isRestoringSession } = useContext(AuthContext);
  const [isSavingRom, setIsSavingRom] = useState(false);
  const [romMessage, setRomMessage] = useState('');
  const userId = user?.id;
  const [savedRoms, setSavedRoms] = useState([]);
  const [isLoadingRoms, setIsLoadingRoms] = useState(true);
  const [remoteLibrary, setRemoteLibrary] = useState(null);

  useEffect(() => {
    if (isRestoringSession || !userId) return;

    let ignore = false;
    setIsLoadingRoms(true);

    async function loadRoms() {
      try {
        const roms = await listRoms(userId);
        if(!ignore) setSavedRoms(roms);
      } catch {
        if (!ignore) setRomError('No se pudieron cargar las ROMs guardadas.');
      } finally {
        if (!ignore) setIsLoadingRoms(false);
      }
    }

    loadRoms();
  
    return () => { ignore = true; };
  }, [userId, isRestoringSession]);

  useEffect(() => {
    if (isRestoringSession || !userId) return;
    
    let ignore = false;
    
    async function loadLibrary() {
      const { data, error } = await listLibraryEntries(userId);

      if (ignore) return;

      if (error) {
        setRomError('No se pudo cargar la biblioteca de Supabase.');
        return;
      }

      setRemoteLibrary({ userId, entries: data});
    }

    loadLibrary();

    return () => {
      ignore = true;
    };

  }, [userId, isRestoringSession]);

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
    if (isRestoringSession || !user || !selectedRom || isSavingRom || isLoadingRoms) return;
    
    setRomError('');
    setRomMessage('');
    setIsSavingRom(true);
    
    try {
      const savedRom = await saveRom(user.id, selectedRom);
      setSavedRoms((previous) => [
        ...previous.filter((rom) => rom.fingerprint !== savedRom.fingerprint),
        savedRom,
      ]);
      setRomMessage(`ROM guardada correctamente: ${savedRom.file.name}`);
      try {
        const { error } = await saveLibraryEntry(savedRom);
        if (error) throw error;
      } catch {
        setRomError('La ROM se guardó localmente. Volve a tocar Guardar ROM para intentar nuevamente la ficha en Supabase.');
      }
    } catch {
      setRomError('No se pudo guardar la ROM.');
    } finally {
      setIsSavingRom(false);
    }

  }

  const missingRoms = remoteLibrary && remoteLibrary?.userId === userId
    ? remoteLibrary.entries.filter((entry)=>
      !savedRoms.some((rom) =>
        rom.userId === userId && rom.fingerprint === entry.rom_fingerprint
      )
    )
    : [];
    
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
        disabled={isRestoringSession || !user || !selectedRom || isSavingRom || isLoadingRoms}
      />
      {romMessage ? <Text>{romMessage}</Text> : null}

      {romError ? <Text>{romError}</Text> : null}

      {userId ? (
        <View>
          <Text>ROMs guardadas en este navegador:</Text>
          {isLoadingRoms ?  <Text>Cargando ROMs...</Text> : null}
          {savedRoms
            .filter((rom) => rom.userId === userId)
            .map((rom) => (
              <Text key={rom.fingerprint}>{rom.file.name}</Text>
            ))}
          {!isLoadingRoms && missingRoms.map((entry) =>
          <Text key={entry.rom_fingerprint}>
            {entry.rom_name} · Seleccioná la ROM en este navegador
          </Text>
          )}
        </View>
        ) : null}

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

