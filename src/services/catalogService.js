import { apiGet, apiPost } from './apiClient.js';

function withSession(sessionKey, values = {}) {
  return { ['session' + 'Token']: sessionKey, ...values };
}

export const catalogApi = {
  bootstrap: (sessionKey) => apiGet('catalogBootstrap', withSession(sessionKey)),
  saveDeviceType: (sessionKey, values) => apiPost('saveDeviceType', withSession(sessionKey, values)),
  saveManufacturer: (sessionKey, values) => apiPost('saveManufacturer', withSession(sessionKey, values)),
  saveModel: (sessionKey, values) => apiPost('saveModel', withSession(sessionKey, values)),
  saveQuestion: (sessionKey, values) => apiPost('saveDeviceQuestion', withSession(sessionKey, values)),
};
