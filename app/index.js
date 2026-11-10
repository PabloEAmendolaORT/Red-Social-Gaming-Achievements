import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList, Button, TextInput } from 'react-native';
import { useState, useContext, useEffect } from 'react';
import { Link } from 'expo-router';
import { getGames } from '../services/gameService';
import { GameCard } from '../components/GameCard';
import { AuthContext } from '../context/AuthContext';
import { saveRom, listRoms } from '../services/romStorage';
import { saveLibraryEntry, listLibraryEntries, identifyLibraryEntry } from '../services/libraryService';
import { searchRaGames } from '../services/raService';

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
  const [romToIdentify, setRomToIdentify] = useState(null);
  const [gameTitle, setGameTitle] = useState('');
  const [gameResults, setGameResults] = useState([]);
  const [catalogMessage, setCatalogMessage] = useState('');
  const [isSearchingGames, setIsSearchingGames] = useState(false);
  const [isIdentifyingRom, setIsIdentifyingRom] = useState(false);

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
    
  async function handleSearchGames() {
    const title = gameTitle.trim();
    setGameResults([]);

    if (!title) {
        setCatalogMessage('Escribí un título para buscar.');
        return;
    }

    setCatalogMessage('');
    setIsSearchingGames(true);

    try {
        const { data, error } = await searchRaGames(5, title);
        if (error) throw error;

        setGameResults(data);
        if (data.length === 0) setCatalogMessage('No se encontraron juegos.');
    } catch {
        setCatalogMessage('No se pudo consultar el catálogo.');
    } finally {
        setIsSearchingGames(false);
    }
  }

  async function handleIdentifyGame(game){
    if (!romToIdentify || romToIdentify.userId !== userId || isIdentifyingRom) return;

    setCatalogMessage('');
    setIsIdentifyingRom(true);
    
    try {
      const { data, error } = await identifyLibraryEntry(
        romToIdentify.fingerprint,
        game.ra_game_id
      );

      if (error || data !== true) {
        setCatalogMessage('No se pudo guardar la asociación.');
        return;
      }

      const identifiedEntry = {
        rom_fingerprint: romToIdentify.fingerprint,
        rom_name: romToIdentify.file.name,
        ra_game_id: game.ra_game_id,
        game: { title: game.title },
      };

      setRemoteLibrary((current) => {
        if (current && current.userId !== userId) return current;

        const entries = current?.entries ?? [];

        return {
          userId,
          entries: [
            ...entries.filter(
              (entry) => entry.rom_fingerprint !== identifiedEntry.rom_fingerprint
            ),
            identifiedEntry,
          ],
        };
      });

      setGameResults([]);
      setCatalogMessage(`Juego identificado: ${game.title}`);
    } catch {
      setCatalogMessage('No se pudo guardar la asociación.');
    } finally {
      setIsIdentifyingRom(false);
    }
  }

  const libraryEntries = remoteLibrary && remoteLibrary.userId === userId
    ? remoteLibrary.entries
    : [];

  const titlesByFingerprint = new Map(
    libraryEntries.map((entry) => [entry.rom_fingerprint, entry.game?.title])
  );
  
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
        disabled={isRestoringSession || !user || !selectedRom || isSavingRom || isLoadingRoms || isIdentifyingRom}
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
              <View key={rom.fingerprint}>
                <Text>{titlesByFingerprint.get(rom.fingerprint) ?? rom.file.name}</Text>
                {/\.gba$/i.test(rom.file.name) ? (
                <Button
                  title="Identificar juego"
                  disabled={isSearchingGames || isIdentifyingRom}
                  onPress={() => {
                      setRomToIdentify(rom);
                      setGameTitle('');
                      setGameResults([]);
                      setCatalogMessage('');
                  }}
                />
                ) : null}
              </View>
            ))}
          {!isLoadingRoms && missingRoms.map((entry) =>
          <Text key={entry.rom_fingerprint}>
            {entry.game?.title ?? entry.rom_name} · Seleccioná la ROM en este navegador
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

        {romToIdentify && romToIdentify.userId === userId ? (
            <View>
                <Text>Identificar: {romToIdentify.file.name}</Text>
                <TextInput
                    placeholder="Título del juego en GBA"
                    value={gameTitle}
                    onChangeText={setGameTitle}
                    editable={!isSearchingGames}
                />
                <Button
                    title={isSearchingGames ? 'Buscando…' : 'Buscar en el catálogo'}
                    onPress={handleSearchGames}
                    disabled={isSearchingGames}
                />
                {catalogMessage ? <Text>{catalogMessage}</Text> : null}
                {gameResults.map((game) => (
                  <Button
                      key={game.ra_game_id}
                      title={`Elegir ${game.title}`}
                      onPress={() => handleIdentifyGame(game)}
                      disabled={isIdentifyingRom}
                  />
                ))}
            </View>
        ) : null}

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

