# TecReporta ITO

Mapa colaborativo de incidencias del Instituto Tecnológico de Oaxaca (Desarrollo Sustentable).

## Cómo abrirlo
1. Abre la carpeta en Visual Studio Code.
2. Instala la extensión Live Server y pulsa "Go Live" sobre index.html (o abre index.html en el navegador).

## Estructura
- index.html: estructura de la página
- css/styles.css: estilos
- js/data.js: categorías, estados, zonas del croquis, perímetro y PIN de admin
- js/firebase-config.js: datos de tu proyecto Firebase
- js/storage.js: guardado de reportes (Firebase o localStorage)
- js/app.js: mapa, formulario, lista y estadísticas
- img/croquis.jpg: croquis del ITO

## Administrador
Botón "Admin" y PIN 1234 (cámbialo en js/data.js). Permite cambiar estado y eliminar reportes.

## Importante
Con localStorage los reportes se guardan solo en el navegador de cada persona.
Para compartirlos en tiempo real, cambia las funciones de js/storage.js por Firebase (Firestore) o Supabase.
