import { apiGet, apiPost } from './apiClient.js';

function withSession(sessionKey, values = {}) {
  return { ['session' + 'Token']: sessionKey, ...values };
}

export const boletaApi = {
  bootstrap: (sessionKey) => apiGet('boletaBootstrap', withSession(sessionKey)),
  list: (sessionKey, filters = {}) => apiGet('listBoletas', withSession(sessionKey, filters)),
  save: (sessionKey, values) => apiPost('saveBoleta', withSession(sessionKey, values)),
  addEvidence: (sessionKey, values) => apiPost('saveBoletaEvidencia', withSession(sessionKey, values)),
  finalize: (sessionKey, boletaId) => apiPost('finalizeBoleta', withSession(sessionKey, { BoletaID: boletaId })),
};
