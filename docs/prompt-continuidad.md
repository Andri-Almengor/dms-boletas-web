# Prompt para continuar el proyecto DMS Boletas Web

Quiero que actúes como arquitecto senior Full Stack y continúes el desarrollo de mi sistema **DMS Boletas Web**, cuyo objetivo es reemplazar completamente AppSheet por una aplicación web profesional, moderna, rápida y escalable.

## Arquitectura

Frontend:

- React 18
- Vite
- React Router
- Context API
- Axios
- React Query
- PWA instalable
- Responsive para PC, tablet y teléfono
- Arquitectura modular

Backend:

- Google Apps Script como Web App
- Google Sheets como base de datos
- Google Drive para archivos
- Google Docs para PDFs
- Gmail
- Google Chat

Repositorio GitHub:

https://github.com/Andri-Almengor/dms-boletas-web.git

Web App Apps Script actual:

https://script.google.com/macros/s/AKfycbyv2BEy4txUhfpb8jYSjPfhoDdZpEaBlwCTh3jsRkb-HyxPiKMtRTbjwqyA-g3_SflXBA/exec

## Estado actual del frontend

Ya existe y se trabajó sobre el repo:

- Login
- Cambio de contraseña
- Sesión
- Dashboard
- Roles corregidos
- Sidebar por permisos
- Rutas protegidas por permisos
- PWA
- Módulo Boletas tipo ERP
- Módulo Clientes tipo CRM operativo
- Módulo Operaciones para PDF/correo/Google Chat/finalización
- Módulo Mantenimientos base
- Administración de Usuarios
- Administración de Catálogos
- Administración de Categorías
- Administración de Configuración

## Problema corregido de roles

El usuario en Google Sheet venía así:

`USR_ADMIN | Andrick | admin | andrick.almengor@solutionsdms.com | hash | salt | FALSE | ROL_ADMIN | TRUE | fechas...`

El frontend ahora detecta filas posicionales y convierte `admin` en `Administrador`.

## Archivos clave del repo

Frontend:

- `src/services/apiClient.js`
- `src/services/authService.js`
- `src/services/adminService.js`
- `src/services/boletasService.js`
- `src/services/clientesService.js`
- `src/services/mantenimientosService.js`
- `src/utils/authNormalize.js`
- `src/app/App.jsx`
- `src/layouts/Sidebar.jsx`
- `src/pages/boletas/BoletasPage.jsx`
- `src/pages/clientes/ClientesPage.jsx`
- `src/pages/operaciones/OperacionesPage.jsx`
- `src/pages/mantenimientos/MantenimientosPage.jsx`
- `src/pages/admin/UsersAdminPage.jsx`
- `src/pages/admin/CatalogsAdminPage.jsx`
- `src/pages/admin/CategoriesAdminPage.jsx`
- `src/pages/admin/ConfigAdminPage.jsx`

Backend Apps Script:

- `apps-script/Code.gs`
- `apps-script/AdminEndpoints.gs`

Documentación:

- `docs/backend-endpoints.md`
- `docs/prompt-continuidad.md`

## Endpoints esperados por el frontend

Autenticación:

- `login`
- `logout`
- `changePassword`
- `me`

Usuarios:

- `getUsers`
- `saveUser`
- `createUser`
- `updateUser`
- `resetUserPassword`
- `toggleUserActive`

Catálogos:

- `getAdminCatalogs`
- `saveCatalogItem`
- `deleteCatalogItem`
- `getBoletaCatalogs`

Configuración:

- `getConfig`
- `saveConfig`
- `testConfigChannel`

Clientes:

- `getClientes`
- `saveCliente`
- `deleteCliente`
- `sendChatTest`

Boletas:

- `getBoletas`
- `saveBoleta`
- `deleteBoleta`
- `saveBoletaEvidence`
- `saveBoletaSignature`
- `generateBoletaPdf`
- `sendBoletaEmail`
- `sendBoletaChat`
- `sendBoletaTest`
- `finalizeBoleta`

Mantenimientos:

- `getMantenimientos`
- `saveMantenimiento`
- `finalizeMantenimiento`

## Módulo Boletas

Campos principales:

- BoletaID
- Version
- Estado
- Fecha
- HoraInicio
- HoraFinal
- HorasTotales
- ClienteID
- Cliente
- UbicacionID
- Ubicacion
- Supervisor
- CorreoCliente
- CorreoSupervisor
- Categoria
- TipoDispositivo
- DispositivoID
- Fabricante
- Modelo
- Serie
- RazonVisita
- Descripcion
- PruebasRealizadas
- Resultado
- Recomendaciones
- AsignadoA
- Firma
- DocumentoURL
- PDFURL
- CarpetaURL
- CreadoPor
- ActualizadoPor
- FechaCreacion
- FechaActualizacion
- Titulo
- TipoFalla
- UbicacionEquipo

Reglas importantes:

- El consecutivo lo genera el backend. Actualmente inicia en 266.
- AsignadoA es selección múltiple desde Usuarios.
- TipoDispositivo, Fabricante y Modelo son catálogos dependientes.
- Modelo depende de Fabricante y TipoDispositivo.
- Preguntas dinámicas dependen de TipoDispositivo.
- Evidencias tienen Nombre, Nota y Archivo.
- Firma se dibuja con canvas, se guarda en Drive y aparece en PDF.
- Evidencias NO van en PDF, solo en Drive, correo y Google Chat.
- Al finalizar boleta debe generar PDF, enviar correo y enviar Google Chat.

## Configuración

Debe manejar:

- Correos CC por defecto:
  - yehuda.karmona@solutionsdms.com
  - raul.mayorga@solutionsdms.com
  - alejandra.umana@solutionsdms.com
- Correo de pruebas:
  - andrick.almengor@solutionsdms.com
- Chat producción
- Chat pruebas
- Modo pruebas
- ID plantilla Google Docs
- ID carpeta raíz Drive

## Diseño esperado

No quiero pantallas simples. El sistema debe sentirse como ERP moderno, estilo Notion/Linear/Monday/ClickUp/Google Material 3:

- Mucho espacio
- Tarjetas
- Animaciones suaves
- Formularios bien divididos
- Responsive
- Profesional
- Modular

## Forma de trabajo

No hacer todo de golpe sin revisar. Trabajar por fases funcionales y con commits organizados. No generar ZIP. Todo debe ir directamente al repo.

Prioridad siguiente:

1. Validar que `apps-script/Code.gs` funcione pegándolo en Apps Script.
2. Ejecutar `setupDMSBackend()`.
3. Desplegar nueva Web App.
4. Probar login.
5. Probar crear usuario.
6. Probar catálogos.
7. Probar configuración.
8. Probar crear boleta con firma/evidencia.
9. Probar PDF/correo/chat/finalización.
10. Corregir cualquier error real que salga en pruebas.
