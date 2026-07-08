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
Debe devolver un usuario con rol. El normalizador ya soporta estas variantes:

- `Rol`
- `rol`
- `Role`
- `role`
- `Perfil`
- `perfil`
- `Cargo`
- `cargo`
- `TipoUsuario`
- `tipoUsuario`

Respuesta sugerida:

```json
{
  "ok": true,
  "sessionToken": "...",
  "user": {
    "UsuarioID": "USR-001",
    "Nombre": "Andrick Almengor",
    "Correo": "andrick.almengor@solutionsdms.com",
    "Rol": "Administrador",
    "DebeCambiarPassword": false,
    "Permisos": "boletas.view,boletas.create,boletas.edit"
  }
}
```

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

Correos CC deben salir de Configuración:

- yehuda.karmona@solutionsdms.com
- raul.mayorga@solutionsdms.com
- alejandra.umana@solutionsdms.com

Modo prueba debe enviar solo a:

- andrick.almengor@solutionsdms.com

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

Permisos soportados:

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
