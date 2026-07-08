# DMS Boletas Web - Fase 3

Esta versión agrega la base del módulo de catálogos y corrige el problema de `React is not defined`.

## Incluye

- Corrección del ErrorBoundary para no depender de `React` como variable global.
- Panel de administración de catálogos.
- Tipos de dispositivo.
- Fabricantes.
- Modelos asociados a tipo de dispositivo y fabricante.
- Imagen de referencia por modelo.
- Preguntas dinámicas por tipo de dispositivo.
- Estilos para pestañas y tablas administrativas.
- Rutas y menú lateral para Catálogos.

## Instalar

```bash
npm install
npm run dev
```

## Backend

La URL está en:

```txt
src/services/apiClient.js
```

## Nota

En esta fase el panel de catálogos ya deja definida la experiencia visual. En la siguiente iteración conectamos cada formulario con los endpoints reales del Apps Script y las hojas actuales.
