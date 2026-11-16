# Red Social Gaming Achievements

## Qué hace la app

Podés armar tu propia biblioteca de juegos retro cargando ROMs de Game Boy, Game Boy Color y Game Boy Advance. La app te deja jugar directamente en el navegador y retomar tus partidas guardadas. Si vinculás tu perfil de RetroAchievements, podés sincronizar tus logros y comparar tu progreso con el de otros jugadores en el ranking de cada juego.

## Cómo ejecutarla

Necesitás tener Node.js y npm instalados, además de acceso a un proyecto de Supabase configurado para la app. Hacé los siguientes pasos desde la carpeta `red-social-gaming-achievements`.

1. Instalá las dependencias.

   ```bash
   npm ci
   ```

2. Creá un archivo `.env` en esa misma carpeta. Reemplazá los valores de ejemplo por la URL y la clave pública de tu proyecto de Supabase.

   ```dotenv
   EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=tu_clave_publica
   ```

3. Iniciá la app y abrí en el navegador la dirección que aparece en la terminal.

   ```bash
   npm run web
   ```
## Demo

El recorrido se probó en navegador con Pokémon FireRed. Para repetirlo, prepará dos cuentas de la app, cada una vinculada a un perfil distinto de RetroAchievements, y una ROM local de Pokémon FireRed.

1. **Cargá el juego.** Iniciá sesión con la primera cuenta, elegí el archivo de la ROM y presioná **Guardar ROM**. El juego aparece en la biblioteca con las opciones **Jugar** y **Ver detalle y ranking**.
2. **Jugá y guardá.** Abrí el juego, guardá desde el menú de Pokémon y volvé a la biblioteca. La app muestra el progreso total y cuántos logros nuevos hubo en esa sesión. Para ver un incremento, conseguí un logro que todavía esté pendiente en tu cuenta.
3. **Retomá la partida.** Volvé a abrir el juego con la misma cuenta y comprobá que podés continuar desde el guardado.
4. **Cambiá de cuenta.** En el mismo navegador, iniciá sesión con la segunda cuenta, cargá la misma ROM y jugá una sesión. Comprobá que la partida de la primera cuenta queda separada.
5. **Revisá el ranking.** Después de completar una sesión con cada cuenta, abrí **Ver detalle y ranking**. Deberían aparecer ambas cuentas y la marca **(vos)** junto a la cuenta activa.