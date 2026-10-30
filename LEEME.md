# Salidas · Peruvian Andes Adventures

App para que el equipo (guías, cocineros, choferes, asistentes y arrieros) vea sus salidas
desde el celular, **incluso sin señal**. El administrador llena todo en Google Sheets.

## Probar en tu computadora
1. Abre la carpeta en VS Code e instala la extensión **Live Server**.
2. Clic derecho en `index.html` → **Open with Live Server**.
3. Entra con un usuario de ejemplo:

| Usuario | PIN |
|---|---|
| Administrador | 0000 |
| Juan Quispe (guía) | 1111 |
| Pedro Mendoza (cocinero) | 3333 |
| Carlos Flores (chofer) | 5555 |
| Teodoro Cruz (arriero) | 7777 |

## Conectar tu Google Sheets
1. Crea una hoja nueva con dos pestañas: **Salidas** y **Trabajadores**.
2. Importa `plantilla/Salidas.csv` y `plantilla/Trabajadores.csv` (Archivo → Importar), o copia las columnas.
   - Fechas: `2026-11-05` o `05/11/2026`.
   - Si una salida lleva dos guías: `Juan Quispe; Rosa Huamán`.
   - Los nombres en Salidas deben escribirse **igual** que en Trabajadores.
   - Roles válidos: `admin`, `guia`, `cocinero`, `chofer`, `asistente`, `arriero`.
3. **Archivo → Compartir → Publicar en la web** → elige la pestaña "Salidas" → formato **CSV** → Publicar. Copia el enlace.
4. Repite con la pestaña "Trabajadores".
5. Pega los dos enlaces en `config.js` (`URL_SALIDAS` y `URL_TRABAJADORES`).
   En `URL_HOJA_EDITAR` pon el enlace normal de la hoja (botón para el administrador).

> Los cambios en la hoja tardan unos minutos en aparecer en el enlace publicado (así funciona Google).
> El PIN es solo para que cada uno entre a su vista, no es seguridad fuerte: no pongas datos sensibles.

## Publicar gratis (GitHub Pages)
1. Crea una cuenta en github.com y **activa la verificación en dos pasos**.
2. Nuevo repositorio (ej. `salidas`) → **Add file → Upload files** → sube todo el contenido de esta carpeta.
3. **Settings → Pages** → Branch: `main` / root → Save.
4. En 1–2 minutos tendrás el link: `https://TU-USUARIO.github.io/salidas/`.

Alternativa: en app.netlify.com/drop arrastras la carpeta y listo.

## Instalar en el celular (cada trabajador, una sola vez, con internet)
- **Android (Chrome):** abre el link → menú ⋮ → **Instalar app** (o "Agregar a pantalla principal").
- **iPhone (Safari):** abre el link → botón Compartir → **Agregar a pantalla de inicio**.

Antes de cada salida: abrir la app con señal y tocar **↻**. La barra superior dice cuándo fue la última actualización.

## Actualizar la app
Cuando cambies HTML/CSS/JS, sube el número en `sw.js` (`const VERSION = "v2"`) y vuelve a subir los archivos.
Los celulares tomarán la nueva versión la próxima vez que abran la app con señal.

## Opción APK (instalable sin link)
Con **Capacitor** se empaquetan estos mismos archivos dentro de un APK (necesitas Node.js y Android Studio):
```bash
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Salidas" com.peruvianandes.salidas --web-dir www
# copia index.html, style.css, app.js, config.js, datos-ejemplo.js, manifest.json e icons/ a la carpeta www/
npx cap add android
npx cap open android
# En Android Studio: Build → Build App Bundle(s)/APK(s) → Build APK(s)
```
Mandas el `.apk` por WhatsApp; el trabajador lo abre y permite "instalar apps desconocidas".
Ojo: cada mejora implica generar y reenviar un APK nuevo (la PWA se actualiza sola).
