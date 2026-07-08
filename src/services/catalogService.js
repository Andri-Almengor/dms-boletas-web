import { apiGet, apiPost } from './apiClient.js';

export const catalogApi = {
  bootstrap: (sessionKey) => apiGet('catalogBootstrap', { sessionKey }),
  saveDeviceType: (sessionKey, values) => apiPost('saveDeviceType', { sessionKey, ...values }),
  saveManufacturer: (sessionKey, values) => apiPost('saveManufacturer', { sessionKey, ...values }),
  saveModel: (sessionKey, values) => apiPost('saveModel', { sessionKey, ...values }),
  saveQuestion: (sessionKey, values) => apiPost('saveDeviceQuestion', { sessionKey, ...values }),
};
