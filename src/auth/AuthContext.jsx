import React, { createContext, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginRequest, logoutRequest } from '../services/authService.js';
import { clearSession, loadSession, saveSession } from './storage.js';
import { normalizeUser } from '../utils/authNormalize.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => loadSession());
  const navigate = useNavigate();

  const user = session?.user || null;
  const sessionToken = session?.sessionToken || session?.token || session?.session?.token || '';

  async function login(username, password) {
    const response = await loginRequest(username, password);

    if (!response.ok) {
      throw new Error(response.error || response.message || 'No se pudo iniciar sesión.');
    }

    const token = extractSessionToken(response);
    const normalizedUser = normalizeUser(response.user || response.usuario || response.data?.user || response.data?.usuario || response);

    if (!token) {
      console.error('Respuesta de login sin token de sesión:', response);
      throw new Error('El backend no devolvió el token de sesión. Revisa la respuesta del endpoint login.');
    }

    const nextSession = {
      sessionToken: token,
      token,
      user: normalizedUser,
      createdAt: new Date().toISOString(),
      raw: response,
    };

    saveSession(nextSession);
    setSession(nextSession);

    if (normalizedUser.mustChangePassword) {
      navigate('/cambiar-clave', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }

    return nextSession;
  }

  async function logout() {
    const token = sessionToken;
    clearSession();
    setSession(null);
    await logoutRequest(token);
    navigate('/login', { replace: true });
  }

  function updateLocalUser(nextUser) {
    const normalized = normalizeUser(nextUser);
    const nextSession = { ...session, user: normalized };
    saveSession(nextSession);
    setSession(nextSession);
  }

  const value = useMemo(
    () => ({
      session,
      user,
      sessionToken,
      isAuthenticated: Boolean(sessionToken && user),
      login,
      logout,
      updateLocalUser,
    }),
    [session, user, sessionToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return value;
}

function extractSessionToken(response) {
  const direct =
    response.sessionToken ||
    response.SessionToken ||
    response.token ||
    response.Token ||
    response.sessionId ||
    response.SessionID ||
    response.data?.sessionToken ||
    response.data?.SessionToken ||
    response.data?.token ||
    response.data?.Token ||
    response.data?.sessionId ||
    response.data?.SessionID ||
    response.session?.token ||
    response.session?.Token ||
    response.session?.sessionToken ||
    response.session?.SessionToken ||
    response.data?.session?.token ||
    response.data?.session?.Token ||
    response.data?.session?.sessionToken ||
    response.data?.session?.SessionToken ||
    '';

  if (direct) return String(direct);

  return findTokenDeep(response);
}

function findTokenDeep(value, depth = 0) {
  if (!value || depth > 4) return '';

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findTokenDeep(item, depth + 1);
      if (found) return found;
    }
    return '';
  }

  if (typeof value !== 'object') return '';

  for (const [key, item] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase();
    const looksLikeToken =
      normalizedKey === 'token' ||
      normalizedKey === 'sessiontoken' ||
      normalizedKey === 'session_token' ||
      normalizedKey === 'sessionid' ||
      normalizedKey === 'session_id';

    if (looksLikeToken && typeof item === 'string' && item.trim()) {
      return item.trim();
    }

    const found = findTokenDeep(item, depth + 1);
    if (found) return found;
  }

  return '';
}
