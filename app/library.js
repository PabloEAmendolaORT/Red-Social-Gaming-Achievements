import { StyleSheet, View } from 'react-native';
import { useState, useContext, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AuthContext } from '../context/AuthContext';
import { saveRom, listRoms, removeRom } from '../services/romStorage';
import { saveLibraryEntry, listLibraryEntries, identifyLibraryEntry, autoIdentifyLibraryEntry, removeLibraryEntry } from '../services/libraryService';
import { searchRaGames, resolveRaGameId, getRaRomHash, getRaProgress, listPendingPlaySessions, finishPlaySession } from '../services/raService';

import { Button, Page, Panel, Text, TextInput, TextLink, Title, layout } from '../components/RetroUI';

export default function Library() {
  const [showImport, setShowImport] = useState(false);
  
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
  const [isRemovingRom, setIsRemovingRom] = useState(false);
  const { playedRom, newAchievements } = useLocalSearchParams();
  const [playedProgress, setPlayedProgress] = useState(null);
  const [pendingResult, setPendingResult] = useState(null);
  const [retryingSessionId, setRetryingSessionId] = useState(null);

  useEffect(() => {
      if (isRestoringSession || !userId) return;

      let ignore = false;

      async function loadPendingSessions() {
          try {
              const { data, error } = await listPendingPlaySessions(userId);
              if (error) throw error;

              if (!ignore) setPendingResult({ userId, sessions: data });
          } catch {
              if (!ignore) setPendingResult({ userId, error: true });
          }
      }

      loadPendingSessions();
      return () => { ignore = true; };
  }, [userId, isRestoringSession]);

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

  async function tryAutoIdentify(savedRom) {
    const entry = libraryEntries.find(
        (item) => item.rom_fingerprint === savedRom.fingerprint
    );

    if (entry?.ra_game_id) return;

    try {
      const hash = await getRaRomHash(savedRom.file);
      const { data, error } = await resolveRaGameId(hash);
      if (error) throw error;

      const gameId = data?.GameID;
      if (!Number.isInteger(gameId) || gameId <= 0) return;

      const { data: title, error: linkError } = await autoIdentifyLibraryEntry(
          savedRom.fingerprint,
          gameId
      );
      if (linkError) throw linkError;
      if (!title) return;

      setRomMessage(`ROM guardada e identificada: ${title}`);

      const { data: entries } = await listLibraryEntries(savedRom.userId);
      if (entries) setRemoteLibrary({ userId: savedRom.userId, entries });
    } catch {
      setRomMessage('ROM guardada. Podés identificarla desde el catálogo.');
    }
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
        await tryAutoIdentify(savedRom);
      } catch {
        setRomError('La ROM se guardó localmente. Volve a tocar Guardar ROM para intentar nuevamente la ficha en Supabase.');
      }
    } catch {
      setRomError('No se pudo guardar la ROM.');
    } finally {
      setIsSavingRom(false);
    }

  }

  async function handleRemoveRom(fingerprint) {
    if (!userId || isRemovingRom || isSavingRom || isIdentifyingRom) return;

    const confirmed = window.confirm(
        '¿Quitar este juego de tu biblioteca? Se conservarán la partida guardada y el historial.'
    );
    if (!confirmed) return;

    setRomError('');
    setRomMessage('');
    setRomToIdentify(null);
    setIsRemovingRom(true);

    try {
        const { error } = await removeLibraryEntry(userId, fingerprint);
        if (error) throw error;

        setRemoteLibrary((current) => {
            if (current?.userId !== userId) return current;

            return {
                ...current,
                entries: current.entries.filter(
                    (entry) => entry.rom_fingerprint !== fingerprint
                ),
            };
        });

        try {
            await removeRom(userId, fingerprint);
        } catch {
            setRomError('Se quitó la ficha, pero quedó la ROM en este navegador. Podés reintentar.');
            return;
        }

        setSavedRoms((current) =>
            current.filter(
                (rom) => rom.userId !== userId || rom.fingerprint !== fingerprint
            )
        );
        setRomMessage('Juego quitado de tu biblioteca.');
    } catch {
        setRomError('No se pudo quitar el juego de la biblioteca.');
    } finally {
        setIsRemovingRom(false);
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

    const playedEntry = typeof playedRom === 'string'
    ? libraryEntries.find((entry) => entry.rom_fingerprint === playedRom)
    : null;
    const playedGameId = playedEntry?.ra_game_id;

    useEffect(() => {
      setPlayedProgress(null);
      if (!userId || !playedGameId) return;

      let ignore = false;

      async function loadPlayedProgress() {
          try {
            const { data, error } = await getRaProgress(playedGameId);
            if (error || !data) throw error ?? new Error('Progreso ausente.');

            if (!ignore) setPlayedProgress({ userId, playedRom, data });
          } catch (error) {
            if (!ignore) {
              setPlayedProgress({
                userId,
                playedRom,
                errorStatus: error?.context?.status ?? 0,
              });
            }
          }
      }

      loadPlayedProgress();
      return () => { ignore = true; };
    }, [userId, playedRom, playedGameId]);

  const titlesByFingerprint = new Map(
    libraryEntries.map((entry) => [entry.rom_fingerprint, entry.game?.title])
  );

  const gameIdsByFingerprint = new Map(
    libraryEntries.map((entry) => [entry.rom_fingerprint, entry.ra_game_id])
  );

  async function handleRetrySession(sessionId) {
    if (retryingSessionId !== null) return;

    setRetryingSessionId(sessionId);

    try {
        const { data, error } = await finishPlaySession(sessionId);
        if (error) throw error;

        const complete = data?.status === 'complete';

        setPendingResult((current) => {
            if (current?.userId !== userId) return current;

            return {
                ...current,
                sessions: complete
                    ? current.sessions.filter((session) => session.id !== sessionId)
                    : current.sessions,
                message: complete
                    ? `Sesión sincronizada. Logros nuevos: ${data.newUnlockedIds.length}.`
                    : 'La sesión sigue pendiente. Podés reintentar más tarde.',
            };
        });
    } catch {
        setPendingResult((current) => {
            if (current?.userId !== userId) return current;

            return { ...current, message: 'No se pudo sincronizar la sesión.' };
        });
    } finally {
        setRetryingSessionId(null);
    }
  }
  
  if (isRestoringSession) {
    return <Page><Text tone="muted">Cargando sesión…</Text></Page>;
  }

  if (!userId) {
    return (
      <Page>
        <Title>Mi biblioteca</Title>
        <Text tone="muted">Iniciá sesión para agregar juegos a tu colección.</Text>
        <Button title="Iniciar sesión" href="/login" />
      </Page>
    );
  }

  const localRoms = savedRoms.filter((rom) => rom.userId === userId);
  const sessionProgress = playedEntry && playedProgress?.userId === userId &&
    playedProgress.playedRom === playedRom ? playedProgress : null;
  const hasNewAchievements = playedEntry && typeof newAchievements === 'string';
  const pending = pendingResult?.userId === userId ? pendingResult : null;

  return (
    <Page>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Title>Mi biblioteca</Title>
          <Text tone="muted">Tu colección de Game Boy, Game Boy Color y Game Boy Advance.</Text>
        </View>
        <Button
          title={showImport ? 'Cerrar carga' : '+ Agregar juego'}
          onPress={() => {
            if (showImport) setSelectedRom(null);
            setShowImport(!showImport);
          }}
          disabled={isSavingRom || isIdentifyingRom}
          secondary={showImport}
        />
      </View>

      {sessionProgress || hasNewAchievements ? (
        <Panel>
          <Text tone="heading" accessibilityRole="header">Resumen de partida</Text>
          {sessionProgress?.errorStatus === 404 ? (
            <TextLink href="/profile">Asociá tu cuenta de RetroAchievements para ver el progreso.</TextLink>
          ) : sessionProgress?.errorStatus !== undefined ? (
            <Text tone="error">No se pudo actualizar el progreso de RetroAchievements.</Text>
          ) : sessionProgress ? (
            <Text>{playedEntry.game?.title ?? playedEntry.rom_name} · {sessionProgress.data.unlocked} de {sessionProgress.data.total} logros</Text>
          ) : null}
          {hasNewAchievements ? <Text tone="meta">Logros nuevos en esta sesión: {newAchievements}</Text> : null}
        </Panel>
      ) : null}

      {pending?.error || pending?.sessions?.length || pending?.message ? (
        <Panel>
          <Text tone="heading" accessibilityRole="header">Sincronización de partidas</Text>
          {pending.error ? <Text tone="error">No se pudieron consultar las sesiones pendientes.</Text> : null}
          {pending.sessions?.map((session) => (
            <View key={session.id} style={layout.row}>
              <Text>Partida del {new Date(session.ended_at).toLocaleString('es-AR')}</Text>
              <Button
                title={retryingSessionId === session.id ? 'Sincronizando…' : 'Reintentar'}
                disabled={retryingSessionId !== null}
                onPress={() => handleRetrySession(session.id)}
                secondary
              />
            </View>
          ))}
          {pending.message ? <Text accessibilityLiveRegion="polite">{pending.message}</Text> : null}
        </Panel>
      ) : null}

      {showImport ? (
        <Panel>
          <Text tone="heading" accessibilityRole="header">Agregar juego</Text>
          <Text tone="muted">Seleccioná un archivo .gb, .gbc o .gba. La ROM se guarda en este navegador.</Text>
          <View style={layout.row}>
            <input
              className="rom-picker"
              type="file"
              accept=".gb,.gbc,.gba"
              aria-label="Seleccionar una ROM"
              onChange={handleRomChange}
            />
            <Button
              title={isSavingRom ? 'Guardando ROM…' : 'Guardar ROM'}
              onPress={handleSaveRom}
              disabled={!selectedRom || isSavingRom || isLoadingRoms || isIdentifyingRom || isRemovingRom}
            />
          </View>
        </Panel>
      ) : null}
      {romMessage ? <Text accessibilityLiveRegion="polite">{romMessage}</Text> : null}
      {romError ? <Text tone="error" accessibilityRole="alert">{romError}</Text> : null}

      {isLoadingRoms ? <Text tone="muted">Cargando juegos…</Text> : null}
      {!isLoadingRoms && localRoms.length === 0 && missingRoms.length === 0 ? (
        <Panel>
          <Text tone="heading" accessibilityRole="header">Tu colección está vacía</Text>
          <Text tone="muted">Agregá una ROM para empezar a jugar.</Text>
        </Panel>
      ) : null}
      <View style={layout.grid}>
        {localRoms.map((rom) => {
          const gameId = gameIdsByFingerprint.get(rom.fingerprint);
          const extension = rom.file.name.split('.').pop()?.toUpperCase();
          return (
            <Panel key={rom.fingerprint} style={styles.card}>
              <Text tone="meta">{extension}</Text>
              <Text tone="heading" accessibilityRole="header">{titlesByFingerprint.get(rom.fingerprint) ?? rom.file.name}</Text>
              {!gameId && <Text tone="muted">Sin identificar en RetroAchievements</Text>}
              <View style={layout.grow} />
              <View style={layout.row}>
                <Button title="Jugar" href={{ pathname: '/play/[fingerprint]', params: { fingerprint: rom.fingerprint } }} />
                <Button
                  title="Quitar de mi biblioteca"
                  onPress={() => handleRemoveRom(rom.fingerprint)}
                  disabled={isRemovingRom || isSavingRom || isIdentifyingRom}
                  secondary
                />
                {gameId ? <Button title="Ver progreso" href={`/games/ra-${gameId}`} secondary /> : null}
                {!gameId && /\.gba$/i.test(rom.file.name) ? (
                  <Button
                    title="Identificar juego"
                    disabled={isSearchingGames || isIdentifyingRom || isRemovingRom}
                    onPress={() => {
                      setRomToIdentify(rom);
                      setGameTitle('');
                      setGameResults([]);
                      setCatalogMessage('');
                    }}
                    secondary
                  />
                ) : null}
              </View>
            </Panel>
          );
        })}
        {!isLoadingRoms && missingRoms.map((entry) => (
          <Panel key={entry.rom_fingerprint} style={styles.card}>
            <Text tone="heading" accessibilityRole="header">{entry.game?.title ?? entry.rom_name}</Text>
            <Text tone="muted">Falta la ROM en este navegador. Agregala para volver a jugar.</Text>
            <Button title="Agregar ROM" onPress={() => setShowImport(true)} secondary />
            <Button
              title="Quitar de mi biblioteca"
              onPress={() => handleRemoveRom(entry.rom_fingerprint)}
              disabled={isRemovingRom || isSavingRom || isIdentifyingRom}
              secondary
            />
          </Panel>
        ))}
      </View>

      {romToIdentify?.userId === userId ? (
        <Panel>
          <Text tone="heading" accessibilityRole="header">Identificar {romToIdentify.file.name}</Text>
          <TextInput
            accessibilityLabel="Título del juego en GBA"
            autoFocus
            placeholder="Título del juego en GBA"
            value={gameTitle}
            onChangeText={setGameTitle}
            editable={!isSearchingGames}
          />
          <View style={layout.row}>
            <Button
              title={isSearchingGames ? 'Buscando…' : 'Buscar en el catálogo'}
              onPress={handleSearchGames}
              disabled={isSearchingGames}
            />
            <Button title="Cancelar" onPress={() => setRomToIdentify(null)} disabled={isSearchingGames || isIdentifyingRom} secondary />
          </View>
          {catalogMessage ? <Text accessibilityLiveRegion="polite">{catalogMessage}</Text> : null}
          {gameResults.map((game) => (
            <Button key={game.ra_game_id} title={`Elegir ${game.title}`} onPress={() => handleIdentifyGame(game)} disabled={isIdentifyingRom} secondary />
          ))}
        </Panel>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { ...layout.row, justifyContent: 'space-between' },
  headerCopy: { gap: 10 },
  card: { flexBasis: 300, flexGrow: 1, minHeight: 175 },
});
