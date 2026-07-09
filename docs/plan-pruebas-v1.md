# Plan de pruebas V1 · DMS Boletas Web

## 1. Backend Apps Script

1. Pegar `apps-script/Code.gs` en Apps Script.
2. Ejecutar `setupDMSBackend()`.
3. Ejecutar `resetAdminPassword()`.
4. Desplegar nueva versión de la Web App.
5. Probar en navegador:

```text
?action=health
```

Debe responder `ok: true`.

## 2. Login

Probar con:

- Usuario: `admin`
- Contraseña: `DMS12345`

También debe aceptar:

- `Andrick`
- `andrick.almengor@solutionsdms.com`

Si falla, probar:

```text
?action=debugLogin&username=admin
```

Debe indicar:

- `usersCount > 0`
- `found: true`
- `hasHash: true`
- `hasSalt: true`

## 3. Usuarios

Desde Administración → Usuarios:

1. Crear usuario técnico.
2. Confirmar que aparece en la tabla.
3. Reiniciar contraseña.
4. Desactivar usuario.
5. Activar usuario.
6. Cerrar sesión e ingresar con el usuario creado.

Contraseña temporal sugerida: `DMS12345`.

## 4. Catálogos

Desde Administración → Catálogos:

1. Crear tipo dispositivo: `Servidor`.
2. Crear fabricante: `Dell`.
3. Crear modelo: `PowerEdge` ligado a `Servidor` + `Dell`.
4. Crear pregunta dinámica para `Servidor`.
5. Crear categoría nueva.

Luego ir a Boletas y confirmar que aparecen en dropdowns.

## 5. Clientes

Desde Clientes:

1. Crear cliente.
2. Agregar contacto.
3. Agregar ubicación general.
4. Agregar notas.
5. Agregar webhook de Chat si aplica.
6. Guardar y confirmar que aparece.

## 6. Configuración

Desde Administración → Configuración:

1. Revisar correos CC.
2. Configurar correo de pruebas.
3. Configurar Chat de pruebas.
4. Activar modo pruebas.
5. Guardar.
6. Probar correo.
7. Probar Chat.

## 7. Boletas

Desde Boletas:

1. Crear nueva boleta.
2. Seleccionar cliente desde dropdown.
3. Seleccionar ubicación general desde dropdown.
4. Seleccionar ubicación del equipo desde dropdown/escribible.
5. Seleccionar categoría.
6. Seleccionar tipo dispositivo.
7. Seleccionar fabricante.
8. Confirmar que modelo filtra por tipo + fabricante.
9. Seleccionar varios técnicos.
10. Completar título, descripción, pruebas, resultado y recomendaciones.
11. Responder preguntas dinámicas.
12. Agregar evidencias.
13. Dibujar firma.
14. Guardar.

Debe crear `BoletaID` automático desde backend.

## 8. Acciones de Boleta

En la tabla de Boletas:

1. Botón PDF.
2. Botón correo.
3. Botón Chat.
4. Botón finalizar.

Al finalizar debe:

- Marcar Estado = `Finalizada`.
- Generar PDF.
- Enviar correo.
- Enviar Google Chat.
- Guardar links en la boleta.

## 9. Mantenimientos

1. Crear mantenimiento.
2. Agregar evidencias por dispositivo.
3. Guardar.
4. Finalizar.

## 10. Errores comunes

### No deja iniciar sesión

Ejecutar:

```text
resetAdminPassword()
```

y redesplegar.

### Acción no soportada

Significa que Apps Script no tiene el `Code.gs` actualizado o no se desplegó una nueva versión.

### No aparecen dropdowns

Ejecutar `setupDMSBackend()` y luego revisar catálogos en Administración.

### PDF o Drive fallan

Revisar permisos de Apps Script y ejecutar manualmente una vez las funciones para autorizar Drive, Docs y Gmail.
