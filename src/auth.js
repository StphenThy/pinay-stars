import { createContext, useContext } from 'react';

// account: { id, role: 'admin' | 'user', username, display_name, created_at } or null for guests.
export const AuthContext = createContext({ account: null, isAdmin: false, isMember: false, openAccount: () => {} });

export const useAuth = () => useContext(AuthContext);

export const initialsOf = name =>
  String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

export const roleLabel = account => (account?.role === 'admin' ? 'Administrator' : account ? 'Member' : 'Guest');
