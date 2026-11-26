import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  AUTH_LOGOUT_EVENT,
  AUTH_TOKEN_REFRESHED_EVENT,
  STORAGE_TOKEN_KEY,
  STORAGE_USER_KEY,
  authApi,
} from '../services/api';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(STORAGE_TOKEN_KEY) || '');
  const [initializing, setInitializing] = useState(() => Boolean(localStorage.getItem(STORAGE_TOKEN_KEY)));

  const persistSession = useCallback((token, userData) => {
    if (token !== undefined) {
      if (token) {
        localStorage.setItem(STORAGE_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(STORAGE_TOKEN_KEY);
      }
      setAccessToken(token || '');
    }

    if (userData !== undefined) {
      if (userData) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userData));
      } else {
        localStorage.removeItem(STORAGE_USER_KEY);
      }
      setUser(userData || null);
    }
  }, []);

  // Đồng bộ lại thông tin người dùng và vai trò từ /auth/me (không tự suy ra role ở client).
  const loadMe = useCallback(async () => {
    const me = await authApi.me();
    persistSession(undefined, me);
    return me;
  }, [persistSession]);

  const login = useCallback(
    async (credentials) => {
      const data = await authApi.login(credentials);
      persistSession(data.accessToken, data.user);
      return data.user;
    },
    [persistSession],
  );

  const register = useCallback(async (payload) => {
    return authApi.register(payload);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem(STORAGE_TOKEN_KEY)) {
        await authApi.logout();
      }
    } catch {
      // Bỏ qua lỗi mạng khi đăng xuất, vẫn xoá phiên ở trình duyệt.
    } finally {
      persistSession('', null);
    }
  }, [persistSession]);

  const updateUserState = useCallback(
    (nextUser) => {
      persistSession(undefined, nextUser);
    },
    [persistSession],
  );

  useEffect(() => {
    const handleForceLogout = () => {
      setAccessToken('');
      setUser(null);
    };
    const handleTokenRefresh = (event) => {
      setAccessToken(event.detail || '');
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, handleForceLogout);
    window.addEventListener(AUTH_TOKEN_REFRESHED_EVENT, handleTokenRefresh);
    return () => {
      window.removeEventListener(AUTH_LOGOUT_EVENT, handleForceLogout);
      window.removeEventListener(AUTH_TOKEN_REFRESHED_EVENT, handleTokenRefresh);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    if (!token) {
      setInitializing(false);
      return undefined;
    }

    loadMe()
      .catch(() => {
        if (active && !localStorage.getItem(STORAGE_TOKEN_KEY)) {
          setUser(null);
          setAccessToken('');
        }
      })
      .finally(() => {
        if (active) setInitializing(false);
      });

    return () => {
      active = false;
    };
  }, [loadMe]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        initializing,
        isAuthenticated: Boolean(user && accessToken),
        login,
        register,
        logout,
        loadMe,
        updateUserState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth phải được dùng bên trong AuthProvider.');
  }
  return ctx;
}
