/*******************************************************
 * DMS BOLETAS WEB - BACKEND COMPLETO COMPATIBLE
 * Google Apps Script + Google Sheets + Drive + Docs + Gmail + Chat
 *
 * IMPORTANTE:
 * - Soporta hojas existentes llamadas Usuarios, USUARIOS, Clientes, CLIENTES, etc.
 * - Soporta usuario en formato:
 *   UsuarioID | Nombre | Rol | Correo | PasswordHash | Salt | DebeCambiarPassword | RolID | Activo
 * - Ejecutar setupDMSBackend() una vez.
 * - Si no deja entrar, ejecutar resetAdminPassword() y usar DMS12345.
 *******************************************************/

const DMS = {
  TZ: 'America/Costa_Rica',
  TEST_EMAIL: 'andrick.almengor@solutionsdms.com',
  DEFAULT_CC: 'yehuda.karmona@solutionsdms.com,raul.mayorga@solutionsdms.com,alejandra.umana@solutionsdms.com',
  SHEET_ALIASES: {
    CONFIG: ['CONFIG', 'Configuracion', 'Configuración'],
    USERS: ['USUARIOS', 'Usuarios'],
    SESSIONS: ['SESIONES', 'Sesiones'],
    CLIENTS: ['CLIENTES', 'Clientes'],
    LOCATIONS: ['CLIENTE_UBICACIONES', 'Ubicaciones', 'ClienteUbicaciones'],
    CONTACTS: ['CLIENTE_CONTACTOS', 'Contactos', 'ClienteContactos'],
    CATEGORIES: ['CATEGORIAS', 'Categorias', 'Categorías'],
    TYPES: ['TIPOS_DISPOSITIVO', 'TiposDispositivo', 'Tipos dispositivo'],
    MAKERS: ['FABRICANTES', 'Fabricantes'],
    MODELS: ['MODELOS', 'Modelos'],
    QUESTIONS: ['PREGUNTAS_DISPOSITIVO', 'PreguntasDinamicas', 'Preguntas dinámicas'],
    TICKETS: ['BOLETAS', 'Boletas'],
    EVIDENCE: ['BOLETA_EVIDENCIAS', 'BoletaEvidencias', 'Evidencias'],
    ANSWERS: ['BOLETA_RESPUESTAS', 'BoletaRespuestas'],
    MAINT: ['MANTENIMIENTOS', 'Mantenimientos'],
    MAINT_EVIDENCE: ['MANTENIMIENTO_EVIDENCIAS', 'MantenimientoEvidencias'],
    AUDIT: ['AUDITORIA', 'Auditoria', 'Auditoría']
  }
};

const HEADERS = {
  CONFIG: ['Clave','Valor','Descripcion','Editable'],
  USERS: ['UsuarioID','Nombre','Rol','Correo','PasswordHash','Salt','DebeCambiarPassword','RolID','Activo','FechaCreacion','FechaActualizacion','Permisos','Username'],
  SESSIONS: ['SessionID','UsuarioID','Token','FechaCreacion','FechaExpiracion','Activo'],
  CLIENTS: ['ClienteID','Cliente','CorreoPrincipal','Telefono','Direccion','Notas','ChatWebhookURL','Activo','CreadoPor','ActualizadoPor','FechaCreacion','FechaActualizacion'],
  LOCATIONS: ['UbicacionID','ClienteID','Cliente','Ubicacion','Descripcion','Activo','CreadoPor','FechaCreacion'],
  CONTACTS: ['ContactoID','ClienteID','Nombre','Puesto','Correo','Telefono','Notas','Activo','CreadoPor','FechaCreacion'],
  CATEGORIES: ['CategoriaID','Categoria','Descripcion','Activo','CreadoPor','FechaCreacion'],
  TYPES: ['TipoDispositivoID','TipoDispositivo','Descripcion','Activo','CreadoPor','FechaCreacion'],
  MAKERS: ['FabricanteID','Fabricante','Descripcion','Activo','CreadoPor','FechaCreacion'],
  MODELS: ['ModeloID','TipoDispositivoID','FabricanteID','TipoDispositivo','Fabricante','Modelo','Descripcion','ImagenReferenciaURL','Activo','CreadoPor','FechaCreacion'],
  QUESTIONS: ['PreguntaID','TipoDispositivoID','TipoDispositivo','Pregunta','TipoRespuesta','Opciones','Obligatoria','Orden','Activo','CreadoPor','FechaCreacion'],
  TICKETS: ['BoletaID','Version','Estado','Fecha','HoraInicio','HoraFinal','HorasTotales','ClienteID','Cliente','UbicacionID','Ubicacion','Supervisor','CorreoCliente','CorreoSupervisor','Categoria','TipoDispositivo','DispositivoID','Fabricante','Modelo','Serie','RazonVisita','Descripcion','PruebasRealizadas','Resultado','Recomendaciones','AsignadoA','Firma','DocumentoURL','PDFURL','CarpetaURL','CreadoPor','ActualizadoPor','FechaCreacion','FechaActualizacion','Titulo','TipoFalla','UbicacionEquipo','FinalizadoEnviado','CorreoEnviado','ChatEnviado','ModoPrueba'],
  EVIDENCE: ['EvidenciaID','BoletaID','Nombre','Nota','ArchivoURL','ArchivoID','MimeType','Orden','CreadoPor','FechaCreacion','ActualizadoPor','FechaActualizacion'],
  ANSWERS: ['RespuestaID','BoletaID','PreguntaID','Pregunta','Respuesta','CreadoPor','FechaCreacion','ActualizadoPor','FechaActualizacion'],
  MAINT: ['MantenimientoID','Fecha','ClienteRef','Cliente','TituloMantenimiento','Estado','Responsable','DescripcionGeneral','FechaFinalizacion','CreadoPor','ActualizadoPor','FechaCreacion','FechaActualizacion'],
  MAINT_EVIDENCE: ['EvidenciaMantenimientoID','MantenimientoID','NombreDispositivo','Zona','Categoria','Funcionamiento','EnUso','Observacion','Imagenes','CreadoPor','FechaCreacion','ActualizadoPor','FechaActualizacion'],
  AUDIT: ['AuditID','Fecha','UsuarioID','Accion','Modulo','RegistroID','DetalleJSON']
};

function setupDMSBackend() {
  Object.keys(HEADERS).forEach(function(key) { ensureSheet_(key); });
  setConfig_('NEXT_BOLETA_ID', getConfig_('NEXT_BOLETA_ID') || '266', 'Siguiente consecutivo de boleta', true);
  setConfig_('DEFAULT_CC', getConfig_('DEFAULT_CC') || DMS.DEFAULT_CC, 'Correos CC por defecto', true);
  setConfig_('TEST_EMAIL', getConfig_('TEST_EMAIL') || DMS.TEST_EMAIL, 'Correo modo prueba', true);
  setConfig_('CHAT_PROD_WEBHOOK', getConfig_('CHAT_PROD_WEBHOOK') || '', 'Webhook Chat producción', true);
  setConfig_('CHAT_TEST_WEBHOOK', getConfig_('CHAT_TEST_WEBHOOK') || '', 'Webhook Chat pruebas', true);
  setConfig_('MODO_PRUEBAS', getConfig_('MODO_PRUEBAS') || 'false', 'Modo pruebas global', true);
  setConfig_('TEMPLATE_BOLETA_DOC_ID', getConfig_('TEMPLATE_BOLETA_DOC_ID') || '', 'Plantilla Google Docs boleta', true);
  setConfig_('DRIVE_ROOT_FOLDER_ID', getConfig_('DRIVE_ROOT_FOLDER_ID') || createRootFolder_(), 'Carpeta raíz Drive', true);
  seedCatalogs_();
  seedAdmin_();
  return ok_({ message: 'Backend DMS listo', spreadsheetId: ss_().getId() });
}

function resetAdminPassword() {
  ensureSheet_('USERS');
  const users = rows_('USERS');
  let admin = users.find(function(u) {
    return String(val_(u, ['UsuarioID'], '')).toUpperCase() === 'USR_ADMIN' ||
           String(val_(u, ['Correo'], '')).toLowerCase() === DMS.TEST_EMAIL.toLowerCase();
  });

  if (!admin) {
    admin = {
      UsuarioID: 'USR_ADMIN', Nombre: 'Andrick', Username: 'admin', Rol: 'admin', RolID: 'ROL_ADMIN',
      Correo: DMS.TEST_EMAIL, Activo: true, DebeCambiarPassword: false, FechaCreacion: now_()
    };
  }

  const salt = uuid_();
  admin.PasswordHash = hash_('DMS12345', salt);
  admin.Salt = salt;
  admin.PasswordSalt = salt;
  admin.Rol = admin.Rol || 'admin';
  admin.RolID = admin.RolID || 'ROL_ADMIN';
  admin.Activo = true;
  admin.DebeCambiarPassword = false;
  admin.FechaActualizacion = now_();
  upsert_('USERS', 'UsuarioID', admin.UsuarioID || 'USR_ADMIN', admin);
  return ok_({ message: 'Admin reiniciado. Usuario: admin / Andrick / correo. Contraseña: DMS12345' });
}

function doGet(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};
    return json_(route_(p.action || 'health', p));
  } catch (err) {
    return json_(fail_(err));
  }
}

function doPost(e) {
  try {
    const body = parseBody_(e);
    return json_(route_(body.action || 'health', body.data || body));
  } catch (err) {
    return json_(fail_(err));
  }
}

function route_(action, data) {
  const publicActions = ['health', 'login', 'debugLogin'];
  const user = publicActions.indexOf(action) >= 0 ? null : requireSession_(data.sessionToken || data.token || '');

  switch (action) {
    case 'health': return ok_({ app: 'DMS Boletas Web', now: now_() });
    case 'debugLogin': return debugLogin_(data);
    case 'login': return login_(data);
    case 'logout': return logout_(data.sessionToken || data.token);
    case 'changePassword': return changePassword_(user, data);
    case 'me': return ok_({ user: safeUser_(user) });

    case 'getUsers': case 'listUsers': return ok_({ users: rows_('USERS').map(safeUser_) });
    case 'saveUser': case 'createUser': case 'updateUser': return saveUser_(user, data.user || data.usuario || data);
    case 'resetUserPassword': return resetPassword_(user, data.UsuarioID || data.userId);
    case 'toggleUserActive': return toggleUser_(user, data.UsuarioID || data.userId, data.Activo);

    case 'getConfig': return ok_({ config: getConfigObject_() });
    case 'saveConfig': return saveConfig_(user, data.config || data);
    case 'testConfigChannel': return testConfig_(user, data.channel);

    case 'getAdminCatalogs': return ok_({ catalogs: getAdminCatalogs_() });
    case 'getBoletaCatalogs': return getBoletaCatalogs_();
    case 'saveCatalogItem': return saveCatalogItem_(user, data.catalog || data.Catalogo, data.item || data.registro || data);
    case 'deleteCatalogItem': return deleteCatalogItem_(user, data.catalog || data.Catalogo, data.itemId || data.ID);

    case 'getClientes': case 'listClients': return ok_({ clientes: getClientes_() });
    case 'saveCliente': case 'saveClient': return saveCliente_(user, data.cliente || data);
    case 'deleteCliente': return deleteRowById_('CLIENTS', 'ClienteID', data.ClienteID);
    case 'sendChatTest': return sendChatTest_(data);

    case 'getBoletas': return ok_({ boletas: getBoletas_() });
    case 'saveBoleta': return saveBoleta_(user, data.boleta || data);
    case 'deleteBoleta': return deleteRowById_('TICKETS', 'BoletaID', data.BoletaID || data.boletaId);
    case 'saveBoletaEvidence': return saveEvidence_(user, data.BoletaID || data.boletaId, data.evidencia || data);
    case 'saveBoletaSignature': return saveSignature_(user, data.BoletaID || data.boletaId, data.firma);
    case 'generateBoletaPdf': return generatePdf_(user, data.BoletaID || data.boletaId);
    case 'sendBoletaEmail': return sendBoletaEmail_(user, data.BoletaID || data.boletaId, data);
    case 'sendBoletaChat': return sendBoletaChat_(user, data.BoletaID || data.boletaId, data);
    case 'sendBoletaTest': return sendBoletaChat_(user, data.BoletaID || data.boletaId, { modoPrueba: true });
    case 'finalizeBoleta': return finalizeBoleta_(user, data.BoletaID || data.boletaId, data);

    case 'getMantenimientos': return ok_({ mantenimientos: rows_('MAINT') });
    case 'saveMantenimiento': return saveMantenimiento_(user, data.mantenimiento || data);
    case 'finalizeMantenimiento': return finalizeMantenimiento_(user, data.MantenimientoID || data.mantenimientoId);

    default: return fail_('Acción no soportada: ' + action);
  }
}

function debugLogin_(data) {
  const input = String(data.username || data.usuario || data.email || '').toLowerCase().trim();
  const users = rows_('USERS');
  const found = findUserForLogin_(input);
  return ok_({
    input: input,
    usersCount: users.length,
    sheetName: sheet_('USERS').getName(),
    headers: headers_(sheet_('USERS')),
    found: !!found,
    foundUser: found ? safeUser_(found) : null,
    hasHash: found ? !!val_(found, ['PasswordHash', 'Hash'], '') : false,
    hasSalt: found ? !!val_(found, ['Salt', 'PasswordSalt'], '') : false
  });
}

function login_(data) {
  const username = String(data.username || data.usuario || data.email || data.Correo || '').toLowerCase().trim();
  const password = String(data.password || data.clave || data.Password || '');
  if (!username || !password) return fail_('Usuario y contraseña son requeridos.');

  const user = findUserForLogin_(username);
  if (!user) return fail_('Usuario no encontrado.');
  if (!bool_(val_(user, ['Activo'], true), true)) return fail_('Usuario inactivo.');

  const salt = val_(user, ['Salt', 'PasswordSalt', 'passwordSalt'], '');
  const storedHash = val_(user, ['PasswordHash', 'Hash', 'passwordHash'], '');
  if (!storedHash) return fail_('El usuario no tiene PasswordHash configurado.');

  const hash1 = hash_(password, salt);
  const hash2 = hashUtf8_(password, salt);
  const valid = hash1 === storedHash || hash2 === storedHash || password === storedHash;
  if (!valid) return fail_('Credenciales inválidas. Si no recuerdas la clave, ejecuta resetAdminPassword().');

  const token = uuid_() + uuid_();
  append_('SESSIONS', {
    SessionID: uuid_(), UsuarioID: val_(user, ['UsuarioID'], ''), Token: token,
    FechaCreacion: now_(), FechaExpiracion: addDays_(7), Activo: true
  });
  return ok_({ sessionToken: token, token: token, user: safeUser_(user) });
}

function findUserForLogin_(username) {
  return rows_('USERS').find(function(u) {
    const candidates = [
      val_(u, ['Username'], ''), val_(u, ['Usuario'], ''), val_(u, ['NombreUsuario'], ''),
      val_(u, ['Nombre'], ''), val_(u, ['Correo'], ''), val_(u, ['Email'], '')
    ].filter(Boolean).map(function(x) { return String(x).toLowerCase().trim(); });
    return candidates.indexOf(username) >= 0;
  });
}

function logout_(token) {
  const r = findRow_('SESSIONS', 'Token', token);
  if (r) setCell_('SESSIONS', r, 'Activo', false);
  return ok_();
}

function requireSession_(token) {
  if (!token) throw new Error('Sesión requerida.');
  const session = rows_('SESSIONS').find(function(s) { return s.Token === token && bool_(s.Activo, true); });
  if (!session) throw new Error('Sesión inválida o vencida.');
  const user = getById_('USERS', 'UsuarioID', session.UsuarioID);
  if (!user) throw new Error('Usuario de sesión no encontrado.');
  return user;
}

function changePassword_(user, data) {
  const current = String(data.oldPassword || data.currentPassword || data.actual || data.passwordActual || '');
  const next = String(data.newPassword || data.nueva || data.passwordNuevo || '');
  if (!next) return fail_('La nueva contraseña es requerida.');

  const salt = val_(user, ['Salt', 'PasswordSalt'], '');
  const storedHash = val_(user, ['PasswordHash'], '');
  if (storedHash && current) {
    const valid = hash_(current, salt) === storedHash || hashUtf8_(current, salt) === storedHash || current === storedHash;
    if (!valid) return fail_('Contraseña actual incorrecta.');
  }

  const newSalt = uuid_();
  user.Salt = newSalt;
  user.PasswordSalt = newSalt;
  user.PasswordHash = hash_(next, newSalt);
  user.DebeCambiarPassword = false;
  user.FechaActualizacion = now_();
  upsert_('USERS', 'UsuarioID', user.UsuarioID, user);
  return ok_({ message: 'Contraseña actualizada.' });
}

function safeUser_(u) {
  const roleRaw = val_(u, ['Rol', 'role'], '') || roleName_(val_(u, ['RolID'], ''));
  const roleId = val_(u, ['RolID'], '') || roleId_(roleRaw);
  return {
    UsuarioID: val_(u, ['UsuarioID', 'ID'], ''),
    Nombre: val_(u, ['Nombre'], 'Usuario'),
    Username: val_(u, ['Username', 'Usuario'], val_(u, ['Nombre'], '')),
    Correo: val_(u, ['Correo', 'Email'], ''),
    Rol: normalizeRole_(roleRaw || roleId),
    RolID: roleId,
    Activo: bool_(val_(u, ['Activo'], true), true),
    DebeCambiarPassword: bool_(val_(u, ['DebeCambiarPassword'], false), false),
    Permisos: val_(u, ['Permisos'], '') || defaultPerms_(roleId)
  };
}

function saveUser_(actor, u) {
  const id = u.UsuarioID || ('USR_' + uuid_().slice(0, 8).toUpperCase());
  const old = getById_('USERS', 'UsuarioID', id) || {};
  const salt = u.PasswordTemporal ? uuid_() : (val_(old, ['Salt', 'PasswordSalt'], '') || uuid_());
  const role = u.Rol || u.rol || old.Rol || roleName_(old.RolID) || 'Técnico';
  const obj = Object.assign({}, old, {
    UsuarioID: id,
    Nombre: u.Nombre || u.name || old.Nombre || '',
    Username: u.Usuario || u.Username || old.Username || '',
    Rol: role,
    Correo: u.Correo || u.email || old.Correo || '',
    PasswordHash: u.PasswordTemporal ? hash_(u.PasswordTemporal, salt) : (old.PasswordHash || hash_('DMS12345', salt)),
    Salt: salt,
    PasswordSalt: salt,
    DebeCambiarPassword: bool_(u.DebeCambiarPassword, true),
    RolID: roleId_(role),
    Activo: bool_(u.Activo, true),
    FechaCreacion: old.FechaCreacion || now_(),
    FechaActualizacion: now_(),
    Permisos: Array.isArray(u.Permisos) ? u.Permisos.join(',') : (u.Permisos || old.Permisos || '')
  });
  upsert_('USERS', 'UsuarioID', id, obj);
  audit_(actor, 'saveUser', 'usuarios', id, obj);
  return ok_({ user: safeUser_(obj) });
}

function resetPassword_(actor, id) {
  const user = getById_('USERS', 'UsuarioID', id);
  if (!user) return fail_('Usuario no encontrado.');
  const salt = uuid_();
  user.Salt = salt;
  user.PasswordSalt = salt;
  user.PasswordHash = hash_('DMS12345', salt);
  user.DebeCambiarPassword = true;
  user.FechaActualizacion = now_();
  upsert_('USERS', 'UsuarioID', id, user);
  audit_(actor, 'resetPassword', 'usuarios', id, {});
  return ok_({ temporal: 'DMS12345' });
}

function toggleUser_(actor, id, active) {
  const user = getById_('USERS', 'UsuarioID', id);
  if (!user) return fail_('Usuario no encontrado.');
  user.Activo = bool_(active, true);
  user.FechaActualizacion = now_();
  upsert_('USERS', 'UsuarioID', id, user);
  return ok_({ user: safeUser_(user) });
}

function getAdminCatalogs_() {
  return {
    tipos: mapRows_('TYPES', 'TipoDispositivoID', 'TipoDispositivo'),
    fabricantes: mapRows_('MAKERS', 'FabricanteID', 'Fabricante'),
    modelos: rows_('MODELS').map(function(m) { return {
      id: m.ModeloID,
      tipoDispositivo: m.TipoDispositivo || nameById_('TYPES', 'TipoDispositivoID', 'TipoDispositivo', m.TipoDispositivoID),
      fabricante: m.Fabricante || nameById_('MAKERS', 'FabricanteID', 'Fabricante', m.FabricanteID),
      modelo: m.Modelo,
      nombre: m.Modelo,
      imagenReferencia: m.ImagenReferenciaURL,
      activo: bool_(m.Activo, true)
    }; }),
    preguntas: rows_('QUESTIONS').map(function(q) { return {
      id: q.PreguntaID,
      tipoDispositivo: q.TipoDispositivo || nameById_('TYPES', 'TipoDispositivoID', 'TipoDispositivo', q.TipoDispositivoID),
      pregunta: q.Pregunta,
      tipoRespuesta: q.TipoRespuesta,
      obligatorio: bool_(q.Obligatoria, true),
      activo: bool_(q.Activo, true)
    }; }),
    categorias: mapRows_('CATEGORIES', 'CategoriaID', 'Categoria')
  };
}

function getBoletaCatalogs_() {
  const c = getAdminCatalogs_();
  return ok_({ catalogs: {
    estados: ['Pendiente', 'En proceso', 'Finalizada'],
    categorias: c.categorias.map(function(x) { return x.nombre; }),
    tiposDispositivo: c.tipos.map(function(x) { return x.nombre; }),
    fabricantes: c.fabricantes,
    modelos: c.modelos,
    clientes: getClientes_(),
    ubicaciones: rows_('LOCATIONS'),
    usuarios: rows_('USERS').map(safeUser_),
    preguntasDinamicas: questionsByType_()
  } });
}

function saveCatalogItem_(actor, catalog, item) {
  const now = now_();
  let sheetKey, key, obj;
  if (catalog === 'tipos' || catalog === 'tiposDispositivo') {
    sheetKey = 'TYPES'; key = 'TipoDispositivoID';
    obj = { TipoDispositivoID: item.id || item.ID || ('TIP_' + uuid_().slice(0,8)), TipoDispositivo: item.nombre || item.Nombre, Descripcion: item.Descripcion || '', Activo: bool_(item.activo ?? item.Activo, true), CreadoPor: actor.Correo, FechaCreacion: now };
  } else if (catalog === 'fabricantes') {
    sheetKey = 'MAKERS'; key = 'FabricanteID';
    obj = { FabricanteID: item.id || item.ID || ('FAB_' + uuid_().slice(0,8)), Fabricante: item.nombre || item.Nombre, Descripcion: item.Descripcion || '', Activo: bool_(item.activo ?? item.Activo, true), CreadoPor: actor.Correo, FechaCreacion: now };
  } else if (catalog === 'categorias') {
    sheetKey = 'CATEGORIES'; key = 'CategoriaID';
    obj = { CategoriaID: item.id || item.ID || ('CAT_' + uuid_().slice(0,8)), Categoria: item.nombre || item.Nombre, Descripcion: item.Descripcion || '', Activo: bool_(item.activo ?? item.Activo, true), CreadoPor: actor.Correo, FechaCreacion: now };
  } else if (catalog === 'modelos') {
    sheetKey = 'MODELS'; key = 'ModeloID';
    obj = { ModeloID: item.id || item.ID || ('MOD_' + uuid_().slice(0,8)), TipoDispositivoID: idByName_('TYPES','TipoDispositivoID','TipoDispositivo',item.tipoDispositivo || item.TipoDispositivo), FabricanteID: idByName_('MAKERS','FabricanteID','Fabricante',item.fabricante || item.Fabricante), TipoDispositivo: item.tipoDispositivo || item.TipoDispositivo || '', Fabricante: item.fabricante || item.Fabricante || '', Modelo: item.modelo || item.Modelo, Descripcion: '', ImagenReferenciaURL: item.imagenReferencia || item.ImagenReferenciaURL || '', Activo: true, CreadoPor: actor.Correo, FechaCreacion: now };
  } else if (catalog === 'preguntas') {
    sheetKey = 'QUESTIONS'; key = 'PreguntaID';
    obj = { PreguntaID: item.id || item.ID || ('PRE_' + uuid_().slice(0,8)), TipoDispositivoID: idByName_('TYPES','TipoDispositivoID','TipoDispositivo',item.tipoDispositivo || item.TipoDispositivo), TipoDispositivo: item.tipoDispositivo || item.TipoDispositivo || '', Pregunta: item.pregunta || item.Pregunta, TipoRespuesta: item.tipoRespuesta || item.TipoRespuesta || 'Sí/No', Opciones: item.Opciones || '', Obligatoria: bool_(item.obligatorio ?? item.Obligatoria, true), Orden: item.Orden || 1, Activo: true, CreadoPor: actor.Correo, FechaCreacion: now };
  } else return fail_('Catálogo no soportado: ' + catalog);
  upsert_(sheetKey, key, obj[key], obj);
  return ok_({ item: obj });
}

function deleteCatalogItem_(actor, catalog, id) {
  const map = { tipos: ['TYPES','TipoDispositivoID','TipoDispositivo'], tiposDispositivo: ['TYPES','TipoDispositivoID','TipoDispositivo'], fabricantes: ['MAKERS','FabricanteID','Fabricante'], categorias: ['CATEGORIES','CategoriaID','Categoria'], modelos: ['MODELS','ModeloID','Modelo'], preguntas: ['QUESTIONS','PreguntaID','Pregunta'] };
  const m = map[catalog];
  if (!m) return fail_('Catálogo no soportado.');
  const direct = deleteRowById_(m[0], m[1], id, true);
  if (direct.ok) return direct;
  return deleteRowById_(m[0], m[2], id, false);
}

function getConfigObject_() {
  return {
    correosCC: getConfig_('DEFAULT_CC') || DMS.DEFAULT_CC,
    correoPruebas: getConfig_('TEST_EMAIL') || DMS.TEST_EMAIL,
    chatProduccion: getConfig_('CHAT_PROD_WEBHOOK') || '',
    chatPruebas: getConfig_('CHAT_TEST_WEBHOOK') || '',
    modoPruebas: bool_(getConfig_('MODO_PRUEBAS'), false),
    templateBoletaId: getConfig_('TEMPLATE_BOLETA_DOC_ID') || '',
    carpetaRaizDriveId: getConfig_('DRIVE_ROOT_FOLDER_ID') || ''
  };
}

function saveConfig_(actor, c) {
  setConfig_('DEFAULT_CC', c.correosCC, 'Correos CC', true);
  setConfig_('TEST_EMAIL', c.correoPruebas, 'Correo prueba', true);
  setConfig_('CHAT_PROD_WEBHOOK', c.chatProduccion, 'Chat producción', true);
  setConfig_('CHAT_TEST_WEBHOOK', c.chatPruebas, 'Chat pruebas', true);
  setConfig_('MODO_PRUEBAS', String(c.modoPruebas), 'Modo pruebas', true);
  setConfig_('TEMPLATE_BOLETA_DOC_ID', c.templateBoletaId, 'Plantilla', true);
  setConfig_('DRIVE_ROOT_FOLDER_ID', c.carpetaRaizDriveId, 'Carpeta raíz', true);
  return ok_({ config: getConfigObject_() });
}

function testConfig_(actor, channel) {
  const cfg = getConfigObject_();
  const msg = 'Prueba DMS Boletas Web ' + channel + ' ' + now_();
  if (channel === 'correoPruebas') {
    GmailApp.sendEmail(cfg.correoPruebas, 'Prueba DMS Boletas Web', msg);
    return ok_();
  }
  const url = channel === 'chatProduccion' ? cfg.chatProduccion : cfg.chatPruebas;
  if (!url) return fail_('Webhook no configurado.');
  postChat_(url, msg);
  return ok_();
}

function getClientes_() {
  return rows_('CLIENTS').map(function(c) { return {
    ClienteID: c.ClienteID,
    Nombre: c.Cliente,
    Cliente: c.Cliente,
    Correos: c.CorreoPrincipal ? [c.CorreoPrincipal] : [],
    Notas: c.Notas,
    ChatWebhookURL: c.ChatWebhookURL,
    Ubicaciones: rows_('LOCATIONS').filter(function(l) { return l.ClienteID === c.ClienteID; }),
    Contactos: rows_('CONTACTS').filter(function(x) { return x.ClienteID === c.ClienteID; }),
    Activo: bool_(c.Activo, true)
  }; });
}

function saveCliente_(actor, c) {
  const id = c.ClienteID || ('CLI_' + uuid_().slice(0,8));
  const old = getById_('CLIENTS', 'ClienteID', id) || {};
  const obj = Object.assign({}, old, {
    ClienteID: id,
    Cliente: c.Nombre || c.Cliente || old.Cliente || '',
    CorreoPrincipal: (c.Correos && c.Correos[0] && (c.Correos[0].Correo || c.Correos[0])) || c.CorreoPrincipal || old.CorreoPrincipal || '',
    Telefono: c.Telefono || old.Telefono || '',
    Direccion: c.Direccion || old.Direccion || '',
    Notas: c.Notas || '',
    ChatWebhookURL: c.ChatWebhookURL || '',
    Activo: bool_(c.Activo, true),
    CreadoPor: old.CreadoPor || actor.Correo,
    ActualizadoPor: actor.Correo,
    FechaCreacion: old.FechaCreacion || now_(),
    FechaActualizacion: now_()
  });
  upsert_('CLIENTS', 'ClienteID', id, obj);
  (c.Contactos || []).forEach(function(x) { upsert_('CONTACTS','ContactoID',x.ContactoID || x.id || uuid_(), { ContactoID: x.ContactoID || x.id || uuid_(), ClienteID: id, Nombre: x.Nombre || '', Puesto: x.Cargo || '', Correo: x.Correo || '', Telefono: x.Telefono || '', Notas: x.Notas || '', Activo: true, CreadoPor: actor.Correo, FechaCreacion: now_() }); });
  (c.Ubicaciones || []).forEach(function(x) { upsert_('LOCATIONS','UbicacionID',x.UbicacionID || x.id || uuid_(), { UbicacionID: x.UbicacionID || x.id || uuid_(), ClienteID: id, Cliente: obj.Cliente, Ubicacion: x.Nombre || x.Ubicacion || '', Descripcion: x.Detalle || '', Activo: true, CreadoPor: actor.Correo, FechaCreacion: now_() }); });
  return ok_({ cliente: obj });
}

function sendChatTest_(data) {
  const url = data.ChatWebhookURL || (data.cliente && data.cliente.ChatWebhookURL);
  if (!url) return fail_('Webhook no configurado.');
  postChat_(url, 'Prueba DMS Cliente ' + now_());
  return ok_();
}

function getBoletas_() {
  return rows_('TICKETS').map(function(b) {
    b.AsignadoA = String(b.AsignadoA || '').split(',').filter(Boolean);
    b.evidencias = rows_('EVIDENCE').filter(function(e) { return String(e.BoletaID) === String(b.BoletaID); });
    return b;
  });
}

function saveBoleta_(actor, b) {
  const id = b.BoletaID || nextBoletaId_();
  const old = getById_('TICKETS', 'BoletaID', id) || {};
  const obj = Object.assign({}, old, b, {
    BoletaID: id,
    Version: b.Version || old.Version || 1,
    Estado: b.Estado || old.Estado || 'Pendiente',
    Fecha: b.Fecha || old.Fecha || date_(),
    AsignadoA: Array.isArray(b.AsignadoA) ? b.AsignadoA.join(',') : (b.AsignadoA || ''),
    CreadoPor: old.CreadoPor || actor.Correo,
    ActualizadoPor: actor.Correo,
    FechaCreacion: old.FechaCreacion || now_(),
    FechaActualizacion: now_()
  });
  upsert_('TICKETS', 'BoletaID', id, obj);
  return ok_({ boleta: obj });
}

function saveEvidence_(actor, boletaId, e) {
  if (!boletaId) return fail_('BoletaID requerido.');
  let fileUrl = '', fileId = '', mime = '';
  if (e.Archivo) {
    const file = saveDataUrl_(e.Archivo, e.fileName || e.Nombre || 'evidencia', folder_('Evidencias'));
    fileUrl = file.getUrl(); fileId = file.getId(); mime = file.getMimeType();
  }
  const obj = { EvidenciaID: e.EvidenciaID || e.id || uuid_(), BoletaID: boletaId, Nombre: e.Nombre || '', Nota: e.Nota || '', ArchivoURL: fileUrl || e.ArchivoURL || e.Link || '', ArchivoID: fileId || e.ArchivoID || '', MimeType: mime, Orden: e.Orden || 1, CreadoPor: actor.Correo, FechaCreacion: now_(), ActualizadoPor: actor.Correo, FechaActualizacion: now_() };
  upsert_('EVIDENCE', 'EvidenciaID', obj.EvidenciaID, obj);
  return ok_({ evidencia: obj });
}

function saveSignature_(actor, boletaId, dataUrl) {
  if (!dataUrl) return fail_('Firma vacía.');
  const f = saveDataUrl_(dataUrl, 'Firma_Boleta_' + boletaId + '.png', folder_('Firmas'));
  const b = getById_('TICKETS', 'BoletaID', boletaId) || { BoletaID: boletaId };
  b.Firma = f.getUrl(); b.ActualizadoPor = actor.Correo; b.FechaActualizacion = now_();
  upsert_('TICKETS', 'BoletaID', boletaId, b);
  return ok_({ firma: f.getUrl() });
}

function generatePdf_(actor, boletaId) {
  const b = getById_('TICKETS', 'BoletaID', boletaId);
  if (!b) return fail_('Boleta no encontrada.');
  const template = getConfig_('TEMPLATE_BOLETA_DOC_ID');
  let docFile;
  if (template) docFile = DriveApp.getFileById(template).makeCopy('Boleta_' + boletaId, folder_('PDF'));
  else {
    const doc = DocumentApp.create('Boleta_' + boletaId);
    const body = doc.getBody();
    body.appendParagraph('Reporte Técnico - ' + (b.Titulo || '')).setHeading(DocumentApp.ParagraphHeading.HEADING1);
    Object.keys(b).forEach(function(k) { body.appendParagraph(k + ': ' + b[k]); });
    doc.saveAndClose();
    docFile = DriveApp.getFileById(doc.getId());
    folder_('PDF').addFile(docFile);
    try { DriveApp.getRootFolder().removeFile(docFile); } catch (e) {}
  }
  const pdfFile = folder_('PDF').createFile(docFile.getAs(MimeType.PDF)).setName('Boleta_' + boletaId + '.pdf');
  b.DocumentoURL = docFile.getUrl(); b.PDFURL = pdfFile.getUrl(); b.CarpetaURL = folder_('Boletas').getUrl();
  upsert_('TICKETS', 'BoletaID', boletaId, b);
  return ok_({ boleta: b, pdfUrl: b.PDFURL });
}

function sendBoletaEmail_(actor, boletaId, opt) {
  let b = getById_('TICKETS', 'BoletaID', boletaId);
  if (!b) return fail_('Boleta no encontrada.');
  if (!b.PDFURL) { generatePdf_(actor, boletaId); b = getById_('TICKETS', 'BoletaID', boletaId); }
  const cfg = getConfigObject_();
  const test = bool_(opt.modoPrueba ?? cfg.modoPruebas, false);
  const to = test ? cfg.correoPruebas : (opt.copiaCliente ? b.CorreoCliente : cfg.correoPruebas);
  const cc = test ? '' : cfg.correosCC;
  GmailApp.sendEmail(to, 'Reporte Técnico - ' + (b.Titulo || b.BoletaID), emailBody_(b), { cc: cc, name: 'DMS Reportes Técnicos' });
  b.CorreoEnviado = true;
  upsert_('TICKETS', 'BoletaID', boletaId, b);
  return ok_({ sent: true });
}

function sendBoletaChat_(actor, boletaId, opt) {
  const b = getById_('TICKETS', 'BoletaID', boletaId);
  if (!b) return fail_('Boleta no encontrada.');
  const cfg = getConfigObject_();
  const client = getById_('CLIENTS', 'ClienteID', b.ClienteID) || {};
  const url = bool_(opt.modoPrueba ?? cfg.modoPruebas, false) ? cfg.chatPruebas : (client.ChatWebhookURL || cfg.chatProduccion || cfg.chatPruebas);
  if (!url) return fail_('Webhook no configurado.');
  const ev = rows_('EVIDENCE').filter(function(e) { return String(e.BoletaID) === String(boletaId); }).map(function(e) { return '• ' + e.Nombre + ': ' + e.ArchivoURL; }).join('\n');
  postChat_(url, 'Boleta finalizada\nCliente: ' + b.Cliente + '\nBoleta: ' + b.BoletaID + '\nPDF: ' + (b.PDFURL || '') + '\nEvidencias:\n' + ev);
  b.ChatEnviado = true;
  upsert_('TICKETS', 'BoletaID', boletaId, b);
  return ok_({ sent: true });
}

function finalizeBoleta_(actor, boletaId, opt) {
  let b = getById_('TICKETS', 'BoletaID', boletaId);
  if (!b) return fail_('Boleta no encontrada.');
  b.Estado = 'Finalizada'; b.FechaActualizacion = now_();
  upsert_('TICKETS', 'BoletaID', boletaId, b);
  generatePdf_(actor, boletaId);
  sendBoletaEmail_(actor, boletaId, opt || {});
  sendBoletaChat_(actor, boletaId, opt || {});
  b = getById_('TICKETS', 'BoletaID', boletaId);
  b.FinalizadoEnviado = true;
  upsert_('TICKETS', 'BoletaID', boletaId, b);
  return ok_({ boleta: b });
}

function saveMantenimiento_(actor, m) {
  const id = m.MantenimientoID || ('MANT_' + uuid_().slice(0,8));
  const old = getById_('MAINT', 'MantenimientoID', id) || {};
  const obj = Object.assign({}, old, m, { MantenimientoID: id, Fecha: m.Fecha || date_(), Estado: m.Estado || old.Estado || 'Pendiente', Responsable: m.Responsable || actor.Nombre, CreadoPor: old.CreadoPor || actor.Correo, ActualizadoPor: actor.Correo, FechaCreacion: old.FechaCreacion || now_(), FechaActualizacion: now_() });
  upsert_('MAINT', 'MantenimientoID', id, obj);
  (m.evidencias || []).forEach(function(e) { upsert_('MAINT_EVIDENCE','EvidenciaMantenimientoID',e.EvidenciaMantenimientoID || e.id || uuid_(), { EvidenciaMantenimientoID: e.EvidenciaMantenimientoID || e.id || uuid_(), MantenimientoID: id, NombreDispositivo: e.NombreDispositivo || '', Zona: e.Zona || '', Categoria: e.Categoria || '', Funcionamiento: e.Funcionamiento || '', EnUso: e.EnUso || '', Observacion: e.Observacion || '', Imagenes: e.Imagenes || '', CreadoPor: actor.Correo, FechaCreacion: now_(), ActualizadoPor: actor.Correo, FechaActualizacion: now_() }); });
  return ok_({ mantenimiento: obj });
}

function finalizeMantenimiento_(actor, id) {
  const m = getById_('MAINT', 'MantenimientoID', id);
  if (!m) return fail_('Mantenimiento no encontrado.');
  m.Estado = 'Finalizado'; m.FechaFinalizacion = now_(); m.ActualizadoPor = actor.Correo; m.FechaActualizacion = now_();
  upsert_('MAINT', 'MantenimientoID', id, m);
  return ok_({ mantenimiento: m });
}

function parseBody_(e) {
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  try { return JSON.parse(raw); } catch (err) { return {}; }
}

function ss_() {
  const id = PropertiesService.getScriptProperties().getProperty('DMS_SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  const created = SpreadsheetApp.create('DMS_Boletas_Web_DB');
  PropertiesService.getScriptProperties().setProperty('DMS_SPREADSHEET_ID', created.getId());
  return created;
}

function sheet_(key) { return ensureSheet_(key); }

function ensureSheet_(key) {
  const ss = ss_();
  const aliases = DMS.SHEET_ALIASES[key] || [key];
  let sh = null;
  for (let i = 0; i < aliases.length; i++) {
    sh = ss.getSheetByName(aliases[i]);
    if (sh) break;
  }
  if (!sh) {
    const all = ss.getSheets();
    const normalizedAliases = aliases.map(norm_);
    sh = all.find(function(s) { return normalizedAliases.indexOf(norm_(s.getName())) >= 0; }) || null;
  }
  if (!sh) sh = ss.insertSheet(aliases[0]);

  const requiredHeaders = HEADERS[key] || [];
  if (requiredHeaders.length) {
    const lastCol = Math.max(sh.getLastColumn(), requiredHeaders.length);
    let current = sh.getLastRow() ? sh.getRange(1,1,1,lastCol).getValues()[0] : [];
    if (current.filter(String).length === 0) {
      sh.getRange(1,1,1,requiredHeaders.length).setValues([requiredHeaders]);
    } else {
      requiredHeaders.forEach(function(h) {
        current = sh.getRange(1,1,1,Math.max(sh.getLastColumn(), requiredHeaders.length)).getValues()[0];
        if (current.indexOf(h) < 0) sh.getRange(1, sh.getLastColumn() + 1).setValue(h);
      });
    }
    sh.setFrozenRows(1);
  }
  return sh;
}

function headers_(sh) { return sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]; }

function rows_(key) {
  const sh = sheet_(key);
  const h = headers_(sh);
  const lr = sh.getLastRow();
  if (lr < 2) return [];
  return sh.getRange(2,1,lr-1,h.length).getValues().map(function(r) {
    const o = {};
    h.forEach(function(x,i) { if (x) o[x] = r[i]; });
    return o;
  });
}

function append_(key, obj) {
  const sh = sheet_(key), h = headers_(sh);
  sh.appendRow(h.map(function(k) { return obj[k] !== undefined ? obj[k] : ''; }));
}

function appendObjects_(key, list) { list.forEach(function(x) { append_(key, x); }); }

function findRow_(key, field, value) {
  const sh = sheet_(key), h = headers_(sh), idx = h.indexOf(field);
  if (idx < 0 || sh.getLastRow() < 2) return 0;
  const vals = sh.getRange(2, idx + 1, sh.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < vals.length; i++) if (String(vals[i][0]) === String(value)) return i + 2;
  return 0;
}

function getById_(key, field, value) { return rows_(key).find(function(x) { return String(x[field]) === String(value); }); }

function upsert_(key, field, value, obj) {
  const sh = sheet_(key), h = headers_(sh), row = findRow_(key, field, value);
  const values = h.map(function(k) { return obj[k] !== undefined ? obj[k] : ''; });
  if (row) sh.getRange(row,1,1,h.length).setValues([values]);
  else sh.appendRow(values);
}

function setCell_(key, row, field, value) {
  const sh = sheet_(key), h = headers_(sh), idx = h.indexOf(field);
  if (idx >= 0) sh.getRange(row, idx + 1).setValue(value);
}

function deleteRowById_(key, field, id, silent) {
  const row = findRow_(key, field, id);
  if (!row) return silent ? fail_('Registro no encontrado.') : fail_('Registro no encontrado.');
  sheet_(key).deleteRow(row);
  return ok_({ deleted: id });
}

function mapRows_(key, idField, nameField) {
  return rows_(key).map(function(x) { return { id: x[idField], nombre: x[nameField], activo: bool_(x.Activo, true) }; });
}

function idByName_(key, idField, nameField, value) {
  const row = rows_(key).find(function(x) { return String(x[nameField]) === String(value) || String(x[idField]) === String(value); });
  return row ? row[idField] : value;
}

function nameById_(key, idField, nameField, value) {
  const row = rows_(key).find(function(x) { return String(x[idField]) === String(value) || String(x[nameField]) === String(value); });
  return row ? row[nameField] : value;
}

function getConfig_(key) { const row = getById_('CONFIG', 'Clave', key); return row ? row.Valor : ''; }
function setConfig_(key, value, desc, editable) { upsert_('CONFIG', 'Clave', key, { Clave: key, Valor: value, Descripcion: desc || '', Editable: editable !== false }); }

function createRootFolder_() {
  const folder = DriveApp.createFolder('DMS_Boletas_Web');
  ['Boletas','Evidencias','Firmas','PDF'].forEach(function(n) { folder.createFolder(n); });
  return folder.getId();
}

function rootFolder_() {
  let id = getConfig_('DRIVE_ROOT_FOLDER_ID');
  if (!id) { id = createRootFolder_(); setConfig_('DRIVE_ROOT_FOLDER_ID', id, 'Carpeta raíz', true); }
  return DriveApp.getFolderById(id);
}

function folder_(name) {
  const root = rootFolder_();
  const it = root.getFoldersByName(name);
  return it.hasNext() ? it.next() : root.createFolder(name);
}

function saveDataUrl_(dataUrl, name, folder) {
  const parts = String(dataUrl).split(',');
  const meta = parts[0], b64 = parts[1] || parts[0];
  const mime = (meta.match(/data:(.*?);base64/) || [])[1] || MimeType.PNG;
  return folder.createFile(Utilities.newBlob(Utilities.base64Decode(b64), mime, name));
}

function nextBoletaId_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const n = Number(getConfig_('NEXT_BOLETA_ID') || 266);
    setConfig_('NEXT_BOLETA_ID', String(n + 1), 'Siguiente consecutivo', true);
    return String(n);
  } finally {
    lock.releaseLock();
  }
}

function seedCatalogs_() {
  if (rows_('CATEGORIES').length === 0) appendObjects_('CATEGORIES', [
    { CategoriaID: 'CAT_CORRECTIVO', Categoria: 'M.correctivo', Activo: true, CreadoPor: 'setup', FechaCreacion: now_() },
    { CategoriaID: 'CAT_PREVENTIVO', Categoria: 'M.preventivo', Activo: true, CreadoPor: 'setup', FechaCreacion: now_() },
    { CategoriaID: 'CAT_INSTALACION', Categoria: 'Instalación', Activo: true, CreadoPor: 'setup', FechaCreacion: now_() }
  ]);
  if (rows_('TYPES').length === 0) appendObjects_('TYPES', [
    { TipoDispositivoID: 'TIP_CAMARA', TipoDispositivo: 'Cámara', Activo: true, CreadoPor: 'setup', FechaCreacion: now_() },
    { TipoDispositivoID: 'TIP_BOCINA', TipoDispositivo: 'Bocina', Activo: true, CreadoPor: 'setup', FechaCreacion: now_() },
    { TipoDispositivoID: 'TIP_PUERTA', TipoDispositivo: 'Puerta', Activo: true, CreadoPor: 'setup', FechaCreacion: now_() }
  ]);
  if (rows_('MAKERS').length === 0) appendObjects_('MAKERS', [
    { FabricanteID: 'FAB_AXIS', Fabricante: 'Axis', Activo: true, CreadoPor: 'setup', FechaCreacion: now_() },
    { FabricanteID: 'FAB_HID', Fabricante: 'HID', Activo: true, CreadoPor: 'setup', FechaCreacion: now_() }
  ]);
}

function seedAdmin_() {
  if (rows_('USERS').some(function(u) { return u.UsuarioID === 'USR_ADMIN'; })) return;
  const salt = uuid_();
  append_('USERS', { UsuarioID: 'USR_ADMIN', Nombre: 'Andrick', Username: 'admin', Rol: 'admin', Correo: DMS.TEST_EMAIL, PasswordHash: hash_('DMS12345', salt), Salt: salt, DebeCambiarPassword: false, RolID: 'ROL_ADMIN', Activo: true, FechaCreacion: now_(), FechaActualizacion: now_(), Permisos: '' });
}

function questionsByType_() {
  const out = {};
  rows_('QUESTIONS').forEach(function(q) {
    const type = q.TipoDispositivo || nameById_('TYPES', 'TipoDispositivoID', 'TipoDispositivo', q.TipoDispositivoID);
    if (!out[type]) out[type] = [];
    out[type].push(q.Pregunta);
  });
  return out;
}

function roleId_(role) { const r = String(role || '').toLowerCase(); return r.indexOf('admin') >= 0 ? 'ROL_ADMIN' : r.indexOf('super') >= 0 ? 'ROL_SUPERVISOR' : 'ROL_TECNICO'; }
function roleName_(id) { return id === 'ROL_ADMIN' ? 'Administrador' : id === 'ROL_SUPERVISOR' ? 'Supervisor' : 'Técnico'; }
function normalizeRole_(role) { const r = String(role || '').toLowerCase(); if (r === 'admin' || r === 'rol_admin' || r === 'administrador') return 'Administrador'; if (r.indexOf('super') >= 0) return 'Supervisor'; if (r.indexOf('tec') >= 0 || r.indexOf('téc') >= 0) return 'Técnico'; return role || 'Sin rol'; }
function defaultPerms_(roleId) { return roleId === 'ROL_ADMIN' ? 'admin.view,users.manage,catalogs.manage,config.manage,boletas.view,boletas.create,boletas.edit,boletas.delete,boletas.finalize,clientes.view,clientes.create,clientes.edit,maintenance.view,maintenance.edit' : 'boletas.view,boletas.create,boletas.edit,boletas.finalize,maintenance.view,maintenance.edit'; }

function hash_(password, salt) { return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password) + String(salt))); }
function hashUtf8_(password, salt) { return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password) + String(salt), Utilities.Charset.UTF_8)); }
function uuid_() { return Utilities.getUuid(); }
function now_() { return Utilities.formatDate(new Date(), DMS.TZ, 'yyyy-MM-dd HH:mm:ss'); }
function date_() { return Utilities.formatDate(new Date(), DMS.TZ, 'yyyy-MM-dd'); }
function addDays_(d) { const x = new Date(); x.setDate(x.getDate() + d); return Utilities.formatDate(x, DMS.TZ, 'yyyy-MM-dd HH:mm:ss'); }
function bool_(v, def) { if (v === undefined || v === null || v === '') return def; if (typeof v === 'boolean') return v; return ['true','1','si','sí','yes','x','activo'].indexOf(String(v).toLowerCase()) >= 0; }
function val_(obj, keys, fallback) { for (let i = 0; i < keys.length; i++) { if (obj[keys[i]] !== undefined && obj[keys[i]] !== null && String(obj[keys[i]]).trim() !== '') return obj[keys[i]]; } return fallback; }
function norm_(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); }
function postChat_(url, text) { UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify({ text: text }), muteHttpExceptions: true }); }
function emailBody_(b) { return 'Reporte Técnico\n\nCliente: ' + b.Cliente + '\nBoleta: ' + b.BoletaID + '\nPDF: ' + (b.PDFURL || '') + '\n\nResultado:\n' + (b.Resultado || '') + '\n\nRecomendaciones:\n' + (b.Recomendaciones || ''); }
function audit_(u,a,m,id,d) { try { append_('AUDIT', { AuditID: uuid_(), Fecha: now_(), UsuarioID: u && u.UsuarioID || '', Accion: a, Modulo: m, RegistroID: id, DetalleJSON: JSON.stringify(d || {}) }); } catch(e) {} }
function ok_(payload) { return Object.assign({ ok: true }, payload || {}); }
function fail_(err) { return { ok: false, error: String(err && err.message ? err.message : err) }; }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
