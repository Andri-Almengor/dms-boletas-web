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
  const sessionToken = session?.sessionToken || session?.token || '';

  async function login(username, password) {
    const response = await loginRequest(username, password);

    if (!response.ok) {
      throw new Error(response.error || response.message || 'No se pudo iniciar sesión.');
    }

    const token =
      response.sessionToken ||
      response.token ||
      response.data?.sessionToken ||
      response.data?.token ||
      '';

    const normalizedUser = normalizeUser(response.user || response.data?.user || response);

    const nextSession = {
      sessionToken: token,
      user: normalizedUser,
      createdAt: new Date().toISOString(),
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
