# DMS Boletas Web · Contrato de endpoints Apps Script

La Web App base es:

`https://script.google.com/macros/s/AKfycbyv2BEy4txUhfpb8jYSjPfhoDdZpEaBlwCTh3jsRkb-HyxPiKMtRTbjwqyA-g3_SflXBA/exec`

El frontend envía `POST` con `Content-Type: text/plain;charset=utf-8` y payload:

```json
{
  "action": "nombreAccion",
  "data": {}
}
```

También puede leer por `GET` usando `?action=...`.

## Autenticación

### `login`
Debe devolver un usuario con rol. El normalizador soporta campos nombrados y filas posicionales de Sheet.

Fila posicional soportada:

`UsuarioID | Nombre | Rol | Correo | PasswordHash | Salt | DebeCambiarPassword | RolID | Activo | FechaCreacion | FechaActualizacion`

Respuesta sugerida:

```json
{
  "ok": true,
  "sessionToken": "...",
  "user": {
    "UsuarioID": "USR_ADMIN",
    "Nombre": "Andrick",
    "Correo": "andrick.almengor@solutionsdms.com",
    "Rol": "admin",
    "DebeCambiarPassword": false,
    "Permisos": "boletas.view,boletas.create,boletas.edit"
  }
}
```

## Usuarios y permisos

### `getUsers`
Devuelve usuarios registrados.

```json
{
  "ok": true,
  "users": []
}
```

### `saveUser`
Recibe `data.user` y debe crear o actualizar según `UsuarioID`.

Campos esperados:

- `UsuarioID`
- `Nombre`
- `Usuario`
- `Correo`
- `Rol`
- `PasswordTemporal`
- `DebeCambiarPassword`
- `Activo`
- `Permisos`

### `resetUserPassword`
Recibe `UsuarioID`. Debe poner contraseña temporal y `DebeCambiarPassword = TRUE`.

### `toggleUserActive`
Recibe `UsuarioID` y `Activo`.

## Catálogos administrativos

### `getAdminCatalogs`
Devuelve:

```json
{
  "ok": true,
  "catalogs": {
    "tipos": [],
    "fabricantes": [],
    "modelos": [],
    "preguntas": [],
    "categorias": []
  }
}
```

### `saveCatalogItem`
Recibe:

```json
{
  "catalog": "tipos | fabricantes | modelos | preguntas | categorias",
  "item": {}
}
```

### `deleteCatalogItem`
Recibe `catalog` e `itemId`.

## Configuración

### `getConfig`
Devuelve:

```json
{
  "ok": true,
  "config": {
    "correosCC": "yehuda.karmona@solutionsdms.com, raul.mayorga@solutionsdms.com, alejandra.umana@solutionsdms.com",
    "correoPruebas": "andrick.almengor@solutionsdms.com",
    "chatProduccion": "",
    "chatPruebas": "",
    "modoPruebas": false,
    "templateBoletaId": "",
    "carpetaRaizDriveId": ""
  }
}
```

### `saveConfig`
Recibe `data.config`.

### `testConfigChannel`
Recibe `channel`: `chatProduccion`, `chatPruebas` o `correoPruebas`.

## Boletas

### `getBoletas`
Devuelve las boletas existentes sin cambiar estructura de Sheet.

```json
{
  "ok": true,
  "boletas": []
}
```

### `getBoletaCatalogs`
Debe devolver catálogos usados por el formulario:

```json
{
  "ok": true,
  "catalogs": {
    "estados": ["Pendiente", "En proceso", "Finalizada"],
    "categorias": ["M.correctivo", "M.preventivo", "Instalación"],
    "tiposDispositivo": ["Cámara", "Bocina", "Control de acceso"],
    "fabricantes": [{ "nombre": "Axis", "tipos": ["Cámara", "Bocina"] }],
    "modelos": [{ "nombre": "P3265-LV", "fabricante": "Axis", "tipoDispositivo": "Cámara" }],
    "clientes": [],
    "ubicaciones": [],
    "usuarios": [],
    "preguntasDinamicas": {
      "Cámara": ["Limpieza", "Visualización", "Montaje", "Enfoque"]
    }
  }
}
```

### `saveBoleta`
Recibe `data.boleta`. El backend debe generar el consecutivo si `BoletaID` está vacío.

### `deleteBoleta`
Recibe `BoletaID`.

### `saveBoletaEvidence`
Recibe `BoletaID` y `evidencia` con `Nombre`, `Nota`, `Archivo` base64/dataURL.

### `saveBoletaSignature`
Recibe `BoletaID` y `firma` base64/dataURL. La firma debe guardarse en Drive y vincularse a la boleta.

### `generateBoletaPdf`
Genera Google Doc/PDF con la plantilla existente. No debe incluir evidencias.

### `sendBoletaEmail`
Envía correo con PDF, links de Drive e informe técnico. Recibe:

```json
{
  "BoletaID": "266",
  "copiaCliente": true,
  "modoPrueba": false
}
```

### `sendBoletaChat`
Publica resumen al webhook de cliente o configuración.

### `sendBoletaTest`
Envía prueba de Chat/correo sin finalizar.

### `finalizeBoleta`
Debe marcar estado `Finalizada` y ejecutar el flujo completo:

1. Guardar datos.
2. Crear/actualizar carpeta Drive.
3. Generar PDF.
4. Enviar correo.
5. Enviar Google Chat.

## Clientes

### `getClientes`
Devuelve clientes con contactos, correos, notas, ubicaciones y Chat webhook.

### `saveCliente`
Recibe `cliente`.

### `deleteCliente`
Recibe `ClienteID`.

### `sendChatTest`
Recibe `ClienteID` y `ChatWebhookURL`.

## Mantenimientos

### `getMantenimientos`
Devuelve mantenimientos con evidencias relacionadas.

### `saveMantenimiento`
Recibe encabezado y evidencias.

### `finalizeMantenimiento`
Finaliza mantenimiento y dispara generación/envío si aplica.

## Permisos frontend

- `boletas.view`
- `boletas.create`
- `boletas.edit`
- `boletas.delete`
- `boletas.finalize`
- `clientes.view`
- `clientes.create`
- `clientes.edit`
- `admin.view`
- `users.manage`
- `catalogs.manage`
- `config.manage`
- `maintenance.view`
- `maintenance.edit`

Los administradores tienen todos los permisos por defecto.
