/*******************************************************
 * DMS BOLETAS WEB - BACKEND COMPLETO BASE
 * Google Apps Script + Google Sheets + Drive + Docs + Gmail + Chat
 *
 * Pegar este archivo como Code.gs en Apps Script.
 * Ejecutar setupDMSBackend() una vez.
 *******************************************************/

const DMS = {
  TZ: 'America/Costa_Rica',
  SHEETS: {
    CONFIG: 'CONFIG', USERS: 'USUARIOS', SESSIONS: 'SESIONES', CLIENTS: 'CLIENTES',
    LOCATIONS: 'CLIENTE_UBICACIONES', CONTACTS: 'CLIENTE_CONTACTOS', CATEGORIES: 'CATEGORIAS',
    TYPES: 'TIPOS_DISPOSITIVO', MAKERS: 'FABRICANTES', MODELS: 'MODELOS', QUESTIONS: 'PREGUNTAS_DISPOSITIVO',
    TICKETS: 'BOLETAS', EVIDENCE: 'BOLETA_EVIDENCIAS', ANSWERS: 'BOLETA_RESPUESTAS',
    MAINT: 'MANTENIMIENTOS', MAINT_EVIDENCE: 'MANTENIMIENTO_EVIDENCIAS', AUDIT: 'AUDITORIA'
  },
  TEST_EMAIL: 'andrick.almengor@solutionsdms.com',
  DEFAULT_CC: 'yehuda.karmona@solutionsdms.com,raul.mayorga@solutionsdms.com,alejandra.umana@solutionsdms.com'
};

const HEADERS = {
  CONFIG: ['Clave','Valor','Descripcion','Editable'],
  USUARIOS: ['UsuarioID','Nombre','Username','Correo','PasswordHash','PasswordSalt','DebeCambiarPassword','RolID','Activo','FechaCreacion','FechaActualizacion','Permisos'],
  SESIONES: ['SessionID','UsuarioID','Token','FechaCreacion','FechaExpiracion','Activo'],
  CLIENTES: ['ClienteID','Cliente','CorreoPrincipal','Telefono','Direccion','Notas','ChatWebhookURL','Activo','CreadoPor','ActualizadoPor','FechaCreacion','FechaActualizacion'],
  CLIENTE_UBICACIONES: ['UbicacionID','ClienteID','Ubicacion','Descripcion','Activo','CreadoPor','FechaCreacion'],
  CLIENTE_CONTACTOS: ['ContactoID','ClienteID','Nombre','Puesto','Correo','Telefono','Notas','Activo','CreadoPor','FechaCreacion'],
  CATEGORIAS: ['CategoriaID','Categoria','Descripcion','Activo','CreadoPor','FechaCreacion'],
  TIPOS_DISPOSITIVO: ['TipoDispositivoID','TipoDispositivo','Descripcion','Activo','CreadoPor','FechaCreacion'],
  FABRICANTES: ['FabricanteID','Fabricante','Descripcion','Activo','CreadoPor','FechaCreacion'],
  MODELOS: ['ModeloID','TipoDispositivoID','FabricanteID','Modelo','Descripcion','ImagenReferenciaURL','Activo','CreadoPor','FechaCreacion'],
  PREGUNTAS_DISPOSITIVO: ['PreguntaID','TipoDispositivoID','Pregunta','TipoRespuesta','Opciones','Obligatoria','Orden','Activo','CreadoPor','FechaCreacion'],
  BOLETAS: ['BoletaID','Version','Estado','Fecha','HoraInicio','HoraFinal','HorasTotales','ClienteID','Cliente','UbicacionID','Ubicacion','Supervisor','CorreoCliente','CorreoSupervisor','Categoria','TipoDispositivo','DispositivoID','Fabricante','Modelo','Serie','RazonVisita','Descripcion','PruebasRealizadas','Resultado','Recomendaciones','AsignadoA','Firma','DocumentoURL','PDFURL','CarpetaURL','CreadoPor','ActualizadoPor','FechaCreacion','FechaActualizacion','Titulo','TipoFalla','UbicacionEquipo','FinalizadoEnviado','CorreoEnviado','ChatEnviado','ModoPrueba'],
  BOLETA_EVIDENCIAS: ['EvidenciaID','BoletaID','Nombre','Nota','ArchivoURL','ArchivoID','MimeType','Orden','CreadoPor','FechaCreacion','ActualizadoPor','FechaActualizacion'],
  BOLETA_RESPUESTAS: ['RespuestaID','BoletaID','PreguntaID','Pregunta','Respuesta','CreadoPor','FechaCreacion','ActualizadoPor','FechaActualizacion'],
  MANTENIMIENTOS: ['MantenimientoID','Fecha','ClienteRef','Cliente','TituloMantenimiento','Estado','Responsable','DescripcionGeneral','FechaFinalizacion','CreadoPor','ActualizadoPor','FechaCreacion','FechaActualizacion'],
  MANTENIMIENTO_EVIDENCIAS: ['EvidenciaMantenimientoID','MantenimientoID','NombreDispositivo','Zona','Categoria','Funcionamiento','EnUso','Observacion','Imagenes','CreadoPor','FechaCreacion','ActualizadoPor','FechaActualizacion'],
  AUDITORIA: ['AuditID','Fecha','UsuarioID','Accion','Modulo','RegistroID','DetalleJSON']
};

function setupDMSBackend() {
  Object.keys(HEADERS).forEach(name => ensureSheet_(name, HEADERS[name]));
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
  return ok_({message:'Backend DMS listo', spreadsheetId:ss_().getId()});
}

function doGet(e){try{return json_(route_((e.parameter||{}).action||'health', e.parameter||{}));}catch(err){return json_(fail_(err));}}
function doPost(e){try{const b=parseBody_(e);return json_(route_(b.action||'health', b.data||b));}catch(err){return json_(fail_(err));}}

function route_(action, data){
  const publicActions=['health','login'];
  const user = publicActions.indexOf(action)>=0 ? null : requireSession_(data.sessionToken||data.token||'');
  switch(action){
    case 'health': return ok_({app:'DMS Boletas Web', now:now_()});
    case 'login': return login_(data);
    case 'logout': return logout_(data.sessionToken||data.token);
    case 'changePassword': return changePassword_(user,data);
    case 'me': return ok_({user:safeUser_(user), permissions:user.Permisos||''});
    case 'getUsers': case 'listUsers': return ok_({users:rows_(DMS.SHEETS.USERS).map(safeUser_)});
    case 'saveUser': case 'createUser': case 'updateUser': return saveUser_(user,data.user||data.usuario||data);
    case 'resetUserPassword': return resetPassword_(user,data.UsuarioID||data.userId);
    case 'toggleUserActive': return toggleUser_(user,data.UsuarioID||data.userId,data.Activo);
    case 'getConfig': return ok_({config:getConfigObject_()});
    case 'saveConfig': return saveConfig_(user,data.config||data);
    case 'testConfigChannel': return testConfig_(user,data.channel);
    case 'getAdminCatalogs': return ok_({catalogs:getAdminCatalogs_()});
    case 'getBoletaCatalogs': return getBoletaCatalogs_();
    case 'saveCatalogItem': return saveCatalogItem_(user,data.catalog||data.Catalogo,data.item||data.registro||data);
    case 'deleteCatalogItem': return deleteCatalogItem_(user,data.catalog||data.Catalogo,data.itemId||data.ID);
    case 'getClientes': case 'listClients': return ok_({clientes:getClientes_()});
    case 'saveCliente': case 'saveClient': return saveCliente_(user,data.cliente||data);
    case 'deleteCliente': return deleteRowById_(DMS.SHEETS.CLIENTS,'ClienteID',data.ClienteID);
    case 'sendChatTest': return sendChatTest_(data);
    case 'getBoletas': return ok_({boletas:getBoletas_()});
    case 'saveBoleta': return saveBoleta_(user,data.boleta||data);
    case 'deleteBoleta': return deleteRowById_(DMS.SHEETS.TICKETS,'BoletaID',data.BoletaID||data.boletaId);
    case 'saveBoletaEvidence': return saveEvidence_(user,data.BoletaID||data.boletaId,data.evidencia||data);
    case 'saveBoletaSignature': return saveSignature_(user,data.BoletaID||data.boletaId,data.firma);
    case 'generateBoletaPdf': return generatePdf_(user,data.BoletaID||data.boletaId);
    case 'sendBoletaEmail': return sendBoletaEmail_(user,data.BoletaID||data.boletaId,data);
    case 'sendBoletaChat': return sendBoletaChat_(user,data.BoletaID||data.boletaId,data);
    case 'sendBoletaTest': return sendBoletaChat_(user,data.BoletaID||data.boletaId,{modoPrueba:true});
    case 'finalizeBoleta': return finalizeBoleta_(user,data.BoletaID||data.boletaId,data);
    case 'getMantenimientos': return ok_({mantenimientos:rows_(DMS.SHEETS.MAINT)});
    case 'saveMantenimiento': return saveMantenimiento_(user,data.mantenimiento||data);
    case 'finalizeMantenimiento': return finalizeMantenimiento_(user,data.MantenimientoID||data.mantenimientoId);
    default: return fail_('Acción no soportada: '+action);
  }
}

function login_(data){
  const username=String(data.username||data.usuario||data.email||'').toLowerCase().trim();
  const password=String(data.password||data.clave||'');
  const user=rows_(DMS.SHEETS.USERS).find(u=>String(u.Username||u.Nombre||'').toLowerCase()===username||String(u.Correo||'').toLowerCase()===username);
  if(!user||!bool_(user.Activo,true)) return fail_('Usuario no encontrado o inactivo.');
  if(hash_(password,user.PasswordSalt)!==user.PasswordHash) return fail_('Credenciales inválidas.');
  const token=uuid_()+uuid_();
  append_(DMS.SHEETS.SESSIONS,{SessionID:uuid_(),UsuarioID:user.UsuarioID,Token:token,FechaCreacion:now_(),FechaExpiracion:addDays_(7),Activo:true});
  return ok_({sessionToken:token, token, user:safeUser_(user)});
}
function logout_(token){const sh=sheet_(DMS.SHEETS.SESSIONS),h=headers_(sh),r=findRow_(DMS.SHEETS.SESSIONS,'Token',token);if(r) writeCell_(sh,h,r,'Activo',false);return ok_();}
function requireSession_(token){if(!token) throw new Error('Sesión requerida.');const s=rows_(DMS.SHEETS.SESSIONS).find(x=>x.Token===token&&bool_(x.Activo,true));if(!s) throw new Error('Sesión inválida.');const u=rows_(DMS.SHEETS.USERS).find(x=>x.UsuarioID===s.UsuarioID);if(!u) throw new Error('Usuario de sesión no encontrado.');return u;}
function changePassword_(user,data){const oldPass=String(data.oldPassword||data.actual||''), newPass=String(data.newPassword||data.nueva||'');if(hash_(oldPass,user.PasswordSalt)!==user.PasswordHash) return fail_('Contraseña actual incorrecta.');const salt=uuid_();user.PasswordSalt=salt;user.PasswordHash=hash_(newPass,salt);user.DebeCambiarPassword=false;user.FechaActualizacion=now_();upsert_(DMS.SHEETS.USERS,'UsuarioID',user.UsuarioID,user);return ok_();}
function safeUser_(u){return {UsuarioID:u.UsuarioID,Nombre:u.Nombre,Username:u.Username,Correo:u.Correo,Rol:u.Rol||roleName_(u.RolID),RolID:u.RolID,Activo:bool_(u.Activo,true),DebeCambiarPassword:bool_(u.DebeCambiarPassword,false),Permisos:u.Permisos||defaultPerms_(u.RolID)};}

function saveUser_(actor,u){const id=u.UsuarioID||('USR_'+uuid_().slice(0,8).toUpperCase()), old=getById_(DMS.SHEETS.USERS,'UsuarioID',id)||{}, salt=u.PasswordTemporal?uuid_():(old.PasswordSalt||uuid_());const obj={UsuarioID:id,Nombre:u.Nombre||u.name||old.Nombre||'',Username:u.Usuario||u.Username||old.Username||'',Correo:u.Correo||u.email||old.Correo||'',PasswordHash:u.PasswordTemporal?hash_(u.PasswordTemporal,salt):(old.PasswordHash||hash_('DMS12345',salt)),PasswordSalt:salt,DebeCambiarPassword:bool_(u.DebeCambiarPassword,true),RolID:roleId_(u.Rol||u.rol||old.RolID),Activo:bool_(u.Activo,true),FechaCreacion:old.FechaCreacion||now_(),FechaActualizacion:now_(),Permisos:Array.isArray(u.Permisos)?u.Permisos.join(','):(u.Permisos||old.Permisos||'')};upsert_(DMS.SHEETS.USERS,'UsuarioID',id,obj);audit_(actor,'saveUser','usuarios',id,obj);return ok_({user:safeUser_(obj)});}
function resetPassword_(actor,id){const u=getById_(DMS.SHEETS.USERS,'UsuarioID',id);if(!u)return fail_('Usuario no encontrado.');const salt=uuid_();u.PasswordSalt=salt;u.PasswordHash=hash_('DMS12345',salt);u.DebeCambiarPassword=true;u.FechaActualizacion=now_();upsert_(DMS.SHEETS.USERS,'UsuarioID',id,u);audit_(actor,'resetPassword','usuarios',id,{});return ok_({temporal:'DMS12345'});}
function toggleUser_(actor,id,activo){const u=getById_(DMS.SHEETS.USERS,'UsuarioID',id);if(!u)return fail_('Usuario no encontrado.');u.Activo=bool_(activo,true);u.FechaActualizacion=now_();upsert_(DMS.SHEETS.USERS,'UsuarioID',id,u);return ok_({user:safeUser_(u)});}

function getAdminCatalogs_(){return {tipos:mapRows_(DMS.SHEETS.TYPES,'TipoDispositivoID','TipoDispositivo'),fabricantes:mapRows_(DMS.SHEETS.MAKERS,'FabricanteID','Fabricante'),modelos:rows_(DMS.SHEETS.MODELS).map(m=>({id:m.ModeloID,tipoDispositivo:nameById_(DMS.SHEETS.TYPES,'TipoDispositivoID','TipoDispositivo',m.TipoDispositivoID),fabricante:nameById_(DMS.SHEETS.MAKERS,'FabricanteID','Fabricante',m.FabricanteID),modelo:m.Modelo,imagenReferencia:m.ImagenReferenciaURL,activo:bool_(m.Activo,true)})),preguntas:rows_(DMS.SHEETS.QUESTIONS).map(q=>({id:q.PreguntaID,tipoDispositivo:nameById_(DMS.SHEETS.TYPES,'TipoDispositivoID','TipoDispositivo',q.TipoDispositivoID),pregunta:q.Pregunta,tipoRespuesta:q.TipoRespuesta,obligatorio:bool_(q.Obligatoria,true),activo:bool_(q.Activo,true)})),categorias:mapRows_(DMS.SHEETS.CATEGORIES,'CategoriaID','Categoria')};}
function getBoletaCatalogs_(){const c=getAdminCatalogs_();return ok_({catalogs:{estados:['Pendiente','En proceso','Finalizada'],categorias:c.categorias.map(x=>x.nombre),tiposDispositivo:c.tipos.map(x=>x.nombre),fabricantes:c.fabricantes,modelos:c.modelos,clientes:getClientes_(),ubicaciones:rows_(DMS.SHEETS.LOCATIONS),usuarios:rows_(DMS.SHEETS.USERS).map(safeUser_),preguntasDinamicas:questionsByType_()}});}
function saveCatalogItem_(actor,catalog,item){const now=now_();let sheet,key,obj;if(catalog==='tipos'||catalog==='tiposDispositivo'){sheet=DMS.SHEETS.TYPES;key='TipoDispositivoID';obj={TipoDispositivoID:item.id||item.ID||('TIP_'+uuid_().slice(0,8)),TipoDispositivo:item.nombre||item.Nombre,Descripcion:item.Descripcion||'',Activo:bool_(item.activo??item.Activo,true),CreadoPor:actor.Correo,FechaCreacion:now};}else if(catalog==='fabricantes'){sheet=DMS.SHEETS.MAKERS;key='FabricanteID';obj={FabricanteID:item.id||item.ID||('FAB_'+uuid_().slice(0,8)),Fabricante:item.nombre||item.Nombre,Descripcion:item.Descripcion||'',Activo:bool_(item.activo??item.Activo,true),CreadoPor:actor.Correo,FechaCreacion:now};}else if(catalog==='categorias'){sheet=DMS.SHEETS.CATEGORIES;key='CategoriaID';obj={CategoriaID:item.id||item.ID||('CAT_'+uuid_().slice(0,8)),Categoria:item.nombre||item.Nombre,Descripcion:item.Descripcion||'',Activo:bool_(item.activo??item.Activo,true),CreadoPor:actor.Correo,FechaCreacion:now};}else if(catalog==='modelos'){sheet=DMS.SHEETS.MODELS;key='ModeloID';obj={ModeloID:item.id||item.ID||('MOD_'+uuid_().slice(0,8)),TipoDispositivoID:idByName_(DMS.SHEETS.TYPES,'TipoDispositivoID','TipoDispositivo',item.tipoDispositivo||item.TipoDispositivo),FabricanteID:idByName_(DMS.SHEETS.MAKERS,'FabricanteID','Fabricante',item.fabricante||item.Fabricante),Modelo:item.modelo||item.Modelo,Descripcion:'',ImagenReferenciaURL:item.imagenReferencia||item.ImagenReferencia||'',Activo:true,CreadoPor:actor.Correo,FechaCreacion:now};}else if(catalog==='preguntas'){sheet=DMS.SHEETS.QUESTIONS;key='PreguntaID';obj={PreguntaID:item.id||item.ID||('PRE_'+uuid_().slice(0,8)),TipoDispositivoID:idByName_(DMS.SHEETS.TYPES,'TipoDispositivoID','TipoDispositivo',item.tipoDispositivo||item.TipoDispositivo),Pregunta:item.pregunta||item.Pregunta,TipoRespuesta:item.tipoRespuesta||item.TipoRespuesta||'Sí/No',Opciones:item.Opciones||'',Obligatoria:bool_(item.obligatorio??item.Obligatoria,true),Orden:item.Orden||1,Activo:true,CreadoPor:actor.Correo,FechaCreacion:now};}else return fail_('Catálogo no soportado: '+catalog);upsert_(sheet,key,obj[key],obj);return ok_({item:obj});}
function deleteCatalogItem_(actor,catalog,id){const map={tipos:[DMS.SHEETS.TYPES,'TipoDispositivoID','TipoDispositivo'],tiposDispositivo:[DMS.SHEETS.TYPES,'TipoDispositivoID','TipoDispositivo'],fabricantes:[DMS.SHEETS.MAKERS,'FabricanteID','Fabricante'],categorias:[DMS.SHEETS.CATEGORIES,'CategoriaID','Categoria'],modelos:[DMS.SHEETS.MODELS,'ModeloID','Modelo'],preguntas:[DMS.SHEETS.QUESTIONS,'PreguntaID','Pregunta']};const m=map[catalog];if(!m)return fail_('Catálogo no soportado.');return deleteRowById_(m[0],m[1],id)||deleteRowById_(m[0],m[2],id);}

function getConfigObject_(){return {correosCC:getConfig_('DEFAULT_CC')||DMS.DEFAULT_CC,correoPruebas:getConfig_('TEST_EMAIL')||DMS.TEST_EMAIL,chatProduccion:getConfig_('CHAT_PROD_WEBHOOK')||'',chatPruebas:getConfig_('CHAT_TEST_WEBHOOK')||'',modoPruebas:bool_(getConfig_('MODO_PRUEBAS'),false),templateBoletaId:getConfig_('TEMPLATE_BOLETA_DOC_ID')||'',carpetaRaizDriveId:getConfig_('DRIVE_ROOT_FOLDER_ID')||''};}
function saveConfig_(actor,c){setConfig_('DEFAULT_CC',c.correosCC,'Correos CC',true);setConfig_('TEST_EMAIL',c.correoPruebas,'Correo prueba',true);setConfig_('CHAT_PROD_WEBHOOK',c.chatProduccion,'Chat producción',true);setConfig_('CHAT_TEST_WEBHOOK',c.chatPruebas,'Chat pruebas',true);setConfig_('MODO_PRUEBAS',String(c.modoPruebas),'Modo pruebas',true);setConfig_('TEMPLATE_BOLETA_DOC_ID',c.templateBoletaId,'Plantilla',true);setConfig_('DRIVE_ROOT_FOLDER_ID',c.carpetaRaizDriveId,'Carpeta raíz',true);return ok_({config:getConfigObject_()});}
function testConfig_(actor,channel){const cfg=getConfigObject_(), msg='Prueba DMS Boletas Web '+channel+' '+now_();if(channel==='correoPruebas'){GmailApp.sendEmail(cfg.correoPruebas,'Prueba DMS Boletas Web',msg);return ok_();}const url=channel==='chatProduccion'?cfg.chatProduccion:cfg.chatPruebas;if(!url)return fail_('Webhook no configurado.');postChat_(url,msg);return ok_();}

function getClientes_(){return rows_(DMS.SHEETS.CLIENTS).map(c=>({ClienteID:c.ClienteID,Nombre:c.Cliente,Cliente:c.Cliente,Correos:c.CorreoPrincipal?[c.CorreoPrincipal]:[],Notas:c.Notas,ChatWebhookURL:c.ChatWebhookURL,Ubicaciones:rows_(DMS.SHEETS.LOCATIONS).filter(l=>l.ClienteID===c.ClienteID),Contactos:rows_(DMS.SHEETS.CONTACTS).filter(x=>x.ClienteID===c.ClienteID),Activo:bool_(c.Activo,true)}));}
function saveCliente_(actor,c){const id=c.ClienteID||('CLI_'+uuid_().slice(0,8));const old=getById_(DMS.SHEETS.CLIENTS,'ClienteID',id)||{};const obj={ClienteID:id,Cliente:c.Nombre||c.Cliente||old.Cliente||'',CorreoPrincipal:(c.Correos&&c.Correos[0]&&c.Correos[0].Correo)||c.CorreoPrincipal||old.CorreoPrincipal||'',Telefono:c.Telefono||old.Telefono||'',Direccion:c.Direccion||old.Direccion||'',Notas:c.Notas||'',ChatWebhookURL:c.ChatWebhookURL||'',Activo:bool_(c.Activo,true),CreadoPor:old.CreadoPor||actor.Correo,ActualizadoPor:actor.Correo,FechaCreacion:old.FechaCreacion||now_(),FechaActualizacion:now_()};upsert_(DMS.SHEETS.CLIENTS,'ClienteID',id,obj);(c.Contactos||[]).forEach(x=>upsert_(DMS.SHEETS.CONTACTS,'ContactoID',x.ContactoID||x.id||uuid_(),{ContactoID:x.ContactoID||x.id||uuid_(),ClienteID:id,Nombre:x.Nombre||'',Puesto:x.Cargo||'',Correo:x.Correo||'',Telefono:x.Telefono||'',Notas:x.Notas||'',Activo:true,CreadoPor:actor.Correo,FechaCreacion:now_()}));(c.Ubicaciones||[]).forEach(x=>upsert_(DMS.SHEETS.LOCATIONS,'UbicacionID',x.UbicacionID||x.id||uuid_(),{UbicacionID:x.UbicacionID||x.id||uuid_(),ClienteID:id,Ubicacion:x.Nombre||x.Ubicacion||'',Descripcion:x.Detalle||'',Activo:true,CreadoPor:actor.Correo,FechaCreacion:now_()}));return ok_({cliente:obj});}
function sendChatTest_(data){const url=data.ChatWebhookURL||(data.cliente&&data.cliente.ChatWebhookURL);if(!url)return fail_('Webhook no configurado.');postChat_(url,'Prueba DMS Cliente '+now_());return ok_();}

function getBoletas_(){return rows_(DMS.SHEETS.TICKETS).map(b=>({...b,AsignadoA:String(b.AsignadoA||'').split(',').filter(Boolean),evidencias:rows_(DMS.SHEETS.EVIDENCE).filter(e=>String(e.BoletaID)===String(b.BoletaID))}));}
function saveBoleta_(actor,b){const id=b.BoletaID||nextBoletaId_();const old=getById_(DMS.SHEETS.TICKETS,'BoletaID',id)||{};const obj={...old,...b,BoletaID:id,Version:b.Version||old.Version||1,Estado:b.Estado||old.Estado||'Pendiente',Fecha:b.Fecha||old.Fecha||date_(),AsignadoA:Array.isArray(b.AsignadoA)?b.AsignadoA.join(','):(b.AsignadoA||''),CreadoPor:old.CreadoPor||actor.Correo,ActualizadoPor:actor.Correo,FechaCreacion:old.FechaCreacion||now_(),FechaActualizacion:now_()};upsert_(DMS.SHEETS.TICKETS,'BoletaID',id,obj);return ok_({boleta:obj});}
function saveEvidence_(actor,boletaId,e){if(!boletaId)return fail_('BoletaID requerido.');let fileUrl='',fileId='',mime='';if(e.Archivo){const file=saveDataUrl_(e.Archivo,e.fileName||e.Nombre||'evidencia',folder_('Evidencias'));fileUrl=file.getUrl();fileId=file.getId();mime=file.getMimeType();}const obj={EvidenciaID:e.EvidenciaID||e.id||uuid_(),BoletaID:boletaId,Nombre:e.Nombre||'',Nota:e.Nota||'',ArchivoURL:fileUrl||e.ArchivoURL||e.Link||'',ArchivoID:fileId||e.ArchivoID||'',MimeType:mime,Orden:e.Orden||1,CreadoPor:actor.Correo,FechaCreacion:now_(),ActualizadoPor:actor.Correo,FechaActualizacion:now_()};upsert_(DMS.SHEETS.EVIDENCE,'EvidenciaID',obj.EvidenciaID,obj);return ok_({evidencia:obj});}
function saveSignature_(actor,boletaId,dataUrl){if(!dataUrl)return fail_('Firma vacía.');const f=saveDataUrl_(dataUrl,'Firma_Boleta_'+boletaId+'.png',folder_('Firmas'));const b=getById_(DMS.SHEETS.TICKETS,'BoletaID',boletaId)||{BoletaID:boletaId};b.Firma=f.getUrl();b.ActualizadoPor=actor.Correo;b.FechaActualizacion=now_();upsert_(DMS.SHEETS.TICKETS,'BoletaID',boletaId,b);return ok_({firma:f.getUrl()});}
function generatePdf_(actor,boletaId){const b=getById_(DMS.SHEETS.TICKETS,'BoletaID',boletaId);if(!b)return fail_('Boleta no encontrada.');const template=getConfig_('TEMPLATE_BOLETA_DOC_ID');let docFile;if(template){docFile=DriveApp.getFileById(template).makeCopy('Boleta_'+boletaId,folder_('PDF'));}else{const doc=DocumentApp.create('Boleta_'+boletaId);const body=doc.getBody();body.appendParagraph('Reporte Técnico - '+(b.Titulo||''));Object.keys(b).forEach(k=>body.appendParagraph(k+': '+b[k]));doc.saveAndClose();docFile=DriveApp.getFileById(doc.getId());folder_('PDF').addFile(docFile);try{DriveApp.getRootFolder().removeFile(docFile);}catch(e){}}const pdf=docFile.getAs(MimeType.PDF);const pdfFile=folder_('PDF').createFile(pdf).setName('Boleta_'+boletaId+'.pdf');b.DocumentoURL=docFile.getUrl();b.PDFURL=pdfFile.getUrl();b.CarpetaURL=folder_('Boletas').getUrl();upsert_(DMS.SHEETS.TICKETS,'BoletaID',boletaId,b);return ok_({boleta:b, pdfUrl:b.PDFURL});}
function sendBoletaEmail_(actor,boletaId,opt){let b=getById_(DMS.SHEETS.TICKETS,'BoletaID',boletaId);if(!b)return fail_('Boleta no encontrada.');if(!b.PDFURL) generatePdf_(actor,boletaId), b=getById_(DMS.SHEETS.TICKETS,'BoletaID',boletaId);const cfg=getConfigObject_(), test=bool_(opt.modoPrueba??cfg.modoPruebas,false), to=test?cfg.correoPruebas:(opt.copiaCliente?b.CorreoCliente:cfg.correoPruebas), cc=test?'':cfg.correosCC;const subject='Reporte Técnico - '+(b.Titulo||b.BoletaID);const body=emailBody_(b);GmailApp.sendEmail(to,subject,body,{cc:cc,name:'DMS Reportes Técnicos'});b.CorreoEnviado=true;upsert_(DMS.SHEETS.TICKETS,'BoletaID',boletaId,b);return ok_({sent:true});}
function sendBoletaChat_(actor,boletaId,opt){const b=getById_(DMS.SHEETS.TICKETS,'BoletaID',boletaId);if(!b)return fail_('Boleta no encontrada.');const cfg=getConfigObject_(), client=getById_(DMS.SHEETS.CLIENTS,'ClienteID',b.ClienteID)||{}, url=bool_(opt.modoPrueba??cfg.modoPruebas,false)?cfg.chatPruebas:(client.ChatWebhookURL||cfg.chatProduccion||cfg.chatPruebas);if(!url)return fail_('Webhook no configurado.');const ev=rows_(DMS.SHEETS.EVIDENCE).filter(e=>String(e.BoletaID)===String(boletaId)).map(e=>'• '+e.Nombre+': '+e.ArchivoURL).join('\n');postChat_(url,'Boleta finalizada\nCliente: '+b.Cliente+'\nBoleta: '+b.BoletaID+'\nPDF: '+(b.PDFURL||'')+'\nEvidencias:\n'+ev);b.ChatEnviado=true;upsert_(DMS.SHEETS.TICKETS,'BoletaID',boletaId,b);return ok_({sent:true});}
function finalizeBoleta_(actor,boletaId,opt){let b=getById_(DMS.SHEETS.TICKETS,'BoletaID',boletaId);if(!b)return fail_('Boleta no encontrada.');b.Estado='Finalizada';b.FechaActualizacion=now_();upsert_(DMS.SHEETS.TICKETS,'BoletaID',boletaId,b);generatePdf_(actor,boletaId);sendBoletaEmail_(actor,boletaId,opt||{});sendBoletaChat_(actor,boletaId,opt||{});b=getById_(DMS.SHEETS.TICKETS,'BoletaID',boletaId);b.FinalizadoEnviado=true;upsert_(DMS.SHEETS.TICKETS,'BoletaID',boletaId,b);return ok_({boleta:b});}

function saveMantenimiento_(actor,m){const id=m.MantenimientoID||('MANT_'+uuid_().slice(0,8));const old=getById_(DMS.SHEETS.MAINT,'MantenimientoID',id)||{};const obj={...old,...m,MantenimientoID:id,Fecha:m.Fecha||date_(),Estado:m.Estado||old.Estado||'Pendiente',Responsable:m.Responsable||actor.Nombre,CreadoPor:old.CreadoPor||actor.Correo,ActualizadoPor:actor.Correo,FechaCreacion:old.FechaCreacion||now_(),FechaActualizacion:now_()};upsert_(DMS.SHEETS.MAINT,'MantenimientoID',id,obj);(m.evidencias||[]).forEach(e=>upsert_(DMS.SHEETS.MAINT_EVIDENCE,'EvidenciaMantenimientoID',e.EvidenciaMantenimientoID||e.id||uuid_(),{EvidenciaMantenimientoID:e.EvidenciaMantenimientoID||e.id||uuid_(),MantenimientoID:id,NombreDispositivo:e.NombreDispositivo||'',Zona:e.Zona||'',Categoria:e.Categoria||'',Funcionamiento:e.Funcionamiento||'',EnUso:e.EnUso||'',Observacion:e.Observacion||'',Imagenes:e.Imagenes||'',CreadoPor:actor.Correo,FechaCreacion:now_(),ActualizadoPor:actor.Correo,FechaActualizacion:now_()}));return ok_({mantenimiento:obj});}
function finalizeMantenimiento_(actor,id){const m=getById_(DMS.SHEETS.MAINT,'MantenimientoID',id);if(!m)return fail_('Mantenimiento no encontrado.');m.Estado='Finalizado';m.FechaFinalizacion=now_();m.ActualizadoPor=actor.Correo;m.FechaActualizacion=now_();upsert_(DMS.SHEETS.MAINT,'MantenimientoID',id,m);return ok_({mantenimiento:m});}

function parseBody_(e){const raw=e&&e.postData&&e.postData.contents?e.postData.contents:'{}';try{return JSON.parse(raw);}catch(err){return {};}}
function ss_(){const id=PropertiesService.getScriptProperties().getProperty('DMS_SPREADSHEET_ID');return id?SpreadsheetApp.openById(id):SpreadsheetApp.getActiveSpreadsheet();}
function sheet_(name){return ensureSheet_(name,HEADERS[name]||[]);}
function ensureSheet_(name,headers){const ss=ss_();let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);if(headers&&headers.length){const current=sh.getLastRow()?sh.getRange(1,1,1,Math.max(sh.getLastColumn(),headers.length)).getValues()[0]:[];if(current.filter(String).length===0)sh.getRange(1,1,1,headers.length).setValues([headers]);else headers.filter(h=>current.indexOf(h)<0).forEach(h=>sh.getRange(1,sh.getLastColumn()+1).setValue(h));sh.setFrozenRows(1);}return sh;}
function headers_(sh){return sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];}
function rows_(name){const sh=sheet_(name),h=headers_(sh),lr=sh.getLastRow();if(lr<2)return [];return sh.getRange(2,1,lr-1,h.length).getValues().map(r=>{const o={};h.forEach((x,i)=>o[x]=r[i]);return o;});}
function append_(name,obj){const sh=sheet_(name),h=headers_(sh);sh.appendRow(h.map(k=>obj[k]!==undefined?obj[k]:''));}
function appendObjects_(name,list){list.forEach(x=>append_(name,x));}
function findRow_(name,key,val){const sh=sheet_(name),h=headers_(sh),idx=h.indexOf(key);if(idx<0||sh.getLastRow()<2)return 0;const vals=sh.getRange(2,idx+1,sh.getLastRow()-1,1).getValues();for(let i=0;i<vals.length;i++)if(String(vals[i][0])===String(val))return i+2;return 0;}
function getById_(name,key,val){return rows_(name).find(x=>String(x[key])===String(val));}
function upsert_(name,key,val,obj){const sh=sheet_(name),h=headers_(sh),r=findRow_(name,key,val),row=h.map(k=>obj[k]!==undefined?obj[k]:'');if(r)sh.getRange(r,1,1,h.length).setValues([row]);else sh.appendRow(row);}
function writeCell_(sh,h,row,key,val){const idx=h.indexOf(key);if(idx>=0)sh.getRange(row,idx+1).setValue(val);}
function deleteRowById_(name,key,id){const r=findRow_(name,key,id);if(!r)return fail_('Registro no encontrado.');sheet_(name).deleteRow(r);return ok_({deleted:id});}
function mapRows_(name,idKey,nameKey){return rows_(name).map(x=>({id:x[idKey],nombre:x[nameKey],activo:bool_(x.Activo,true)}));}
function idByName_(name,idKey,nameKey,value){const row=rows_(name).find(x=>String(x[nameKey])===String(value)||String(x[idKey])===String(value));return row?row[idKey]:value;}
function nameById_(name,idKey,nameKey,value){const row=rows_(name).find(x=>String(x[idKey])===String(value)||String(x[nameKey])===String(value));return row?row[nameKey]:value;}
function getConfig_(key){const row=getById_(DMS.SHEETS.CONFIG,'Clave',key);return row?row.Valor:'';}
function setConfig_(key,value,desc,editable){upsert_(DMS.SHEETS.CONFIG,'Clave',key,{Clave:key,Valor:value,Descripcion:desc||'',Editable:editable!==false});}
function createRootFolder_(){const f=DriveApp.createFolder('DMS_Boletas_Web');['Boletas','Evidencias','Firmas','PDF'].forEach(n=>f.createFolder(n));return f.getId();}
function rootFolder_(){let id=getConfig_('DRIVE_ROOT_FOLDER_ID');if(!id){id=createRootFolder_();setConfig_('DRIVE_ROOT_FOLDER_ID',id,'Carpeta raíz',true);}return DriveApp.getFolderById(id);}
function folder_(name){const root=rootFolder_(),it=root.getFoldersByName(name);return it.hasNext()?it.next():root.createFolder(name);}
function saveDataUrl_(dataUrl,name,folder){const parts=String(dataUrl).split(','),meta=parts[0],b64=parts[1]||parts[0],mime=(meta.match(/data:(.*?);base64/)||[])[1]||MimeType.PNG;const blob=Utilities.newBlob(Utilities.base64Decode(b64),mime,name);return folder.createFile(blob);}
function nextBoletaId_(){const n=Number(getConfig_('NEXT_BOLETA_ID')||266);setConfig_('NEXT_BOLETA_ID',String(n+1),'Siguiente consecutivo',true);return String(n);}
function seedCatalogs_(){if(rows_(DMS.SHEETS.CATEGORIES).length===0)appendObjects_(DMS.SHEETS.CATEGORIES,[{CategoriaID:'CAT_CORRECTIVO',Categoria:'M.correctivo',Activo:true,CreadoPor:'setup',FechaCreacion:now_()},{CategoriaID:'CAT_PREVENTIVO',Categoria:'M.preventivo',Activo:true,CreadoPor:'setup',FechaCreacion:now_()},{CategoriaID:'CAT_INSTALACION',Categoria:'Instalación',Activo:true,CreadoPor:'setup',FechaCreacion:now_()}]);if(rows_(DMS.SHEETS.TYPES).length===0)appendObjects_(DMS.SHEETS.TYPES,[{TipoDispositivoID:'TIP_CAMARA',TipoDispositivo:'Cámara',Activo:true,CreadoPor:'setup',FechaCreacion:now_()},{TipoDispositivoID:'TIP_BOCINA',TipoDispositivo:'Bocina',Activo:true,CreadoPor:'setup',FechaCreacion:now_()},{TipoDispositivoID:'TIP_PUERTA',TipoDispositivo:'Puerta',Activo:true,CreadoPor:'setup',FechaCreacion:now_()}]);if(rows_(DMS.SHEETS.MAKERS).length===0)appendObjects_(DMS.SHEETS.MAKERS,[{FabricanteID:'FAB_AXIS',Fabricante:'Axis',Activo:true,CreadoPor:'setup',FechaCreacion:now_()},{FabricanteID:'FAB_HID',Fabricante:'HID',Activo:true,CreadoPor:'setup',FechaCreacion:now_()}]);}
function seedAdmin_(){if(rows_(DMS.SHEETS.USERS).some(u=>u.UsuarioID==='USR_ADMIN'))return;const salt=uuid_();append_(DMS.SHEETS.USERS,{UsuarioID:'USR_ADMIN',Nombre:'Andrick',Username:'admin',Correo:DMS.TEST_EMAIL,PasswordHash:hash_('DMS12345',salt),PasswordSalt:salt,DebeCambiarPassword:false,RolID:'ROL_ADMIN',Activo:true,FechaCreacion:now_(),FechaActualizacion:now_(),Permisos:''});}
function questionsByType_(){const out={};rows_(DMS.SHEETS.QUESTIONS).forEach(q=>{const t=nameById_(DMS.SHEETS.TYPES,'TipoDispositivoID','TipoDispositivo',q.TipoDispositivoID);if(!out[t])out[t]=[];out[t].push(q.Pregunta);});return out;}
function roleId_(role){const r=String(role||'').toLowerCase();return r.includes('admin')?'ROL_ADMIN':r.includes('super')?'ROL_SUPERVISOR':'ROL_TECNICO';}
function roleName_(id){return id==='ROL_ADMIN'?'Administrador':id==='ROL_SUPERVISOR'?'Supervisor':'Técnico';}
function defaultPerms_(roleId){return roleId==='ROL_ADMIN'?'admin.view,users.manage,catalogs.manage,config.manage,boletas.view,boletas.create,boletas.edit,boletas.delete,boletas.finalize,clientes.view,clientes.create,clientes.edit,maintenance.view,maintenance.edit':'boletas.view,boletas.create,boletas.edit,boletas.finalize,maintenance.view,maintenance.edit';}
function hash_(p,s){return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(p)+String(s)));}
function uuid_(){return Utilities.getUuid();}
function now_(){return Utilities.formatDate(new Date(),DMS.TZ,'yyyy-MM-dd HH:mm:ss');}
function date_(){return Utilities.formatDate(new Date(),DMS.TZ,'yyyy-MM-dd');}
function addDays_(d){const x=new Date();x.setDate(x.getDate()+d);return Utilities.formatDate(x,DMS.TZ,'yyyy-MM-dd HH:mm:ss');}
function bool_(v,def){if(v===undefined||v===null||v==='')return def;if(typeof v==='boolean')return v;return ['true','1','si','sí','yes','x','activo'].indexOf(String(v).toLowerCase())>=0;}
function postChat_(url,text){UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',payload:JSON.stringify({text}),muteHttpExceptions:true});}
function emailBody_(b){return 'Reporte Técnico\n\nCliente: '+b.Cliente+'\nBoleta: '+b.BoletaID+'\nPDF: '+(b.PDFURL||'')+'\n\nResultado:\n'+(b.Resultado||'')+'\n\nRecomendaciones:\n'+(b.Recomendaciones||'');}
function audit_(u,a,m,id,d){try{append_(DMS.SHEETS.AUDIT,{AuditID:uuid_(),Fecha:now_(),UsuarioID:u&&u.UsuarioID||'',Accion:a,Modulo:m,RegistroID:id,DetalleJSON:JSON.stringify(d||{})});}catch(e){}}
function ok_(p){return Object.assign({ok:true},p||{});}
function fail_(e){return {ok:false,error:String(e&&e.message?e.message:e)};}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
