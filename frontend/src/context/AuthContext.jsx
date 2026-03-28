import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('paisa_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem('paisa_user', JSON.stringify(user));
    else localStorage.removeItem('paisa_user');
  }, [user]);

  const signup = useCallback(async ({ name, email, password }) => {
    setIsLoading(true);
    // Simulate signup delay
    await new Promise(r => setTimeout(r, 1200));
    const existingUsers = JSON.parse(localStorage.getItem('paisa_users') || '[]');
    if (existingUsers.find(u => u.email === email)) {
      setIsLoading(false);
      throw new Error('Account already exists with this email');
    }
    const newUser = {
      id: Date.now().toString(36),
      name,
      email,
      initials: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      createdAt: new Date().toISOString(),
      plan: 'free',
    };
    existingUsers.push({ ...newUser, password });
    localStorage.setItem('paisa_users', JSON.stringify(existingUsers));
    setUser(newUser);
    setIsLoading(false);
    return newUser;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const existingUsers = JSON.parse(localStorage.getItem('paisa_users') || '[]');
    const found = existingUsers.find(u => u.email === email && u.password === password);
    if (!found) {
      setIsLoading(false);
      throw new Error('Invalid email or password');
    }
    const { password: _, ...userData } = found;
    setUser(userData);
    setIsLoading(false);
    return userData;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('paisa_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signup, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
