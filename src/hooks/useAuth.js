import { useState } from 'react';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  function login(email, senha, usuarios) {
    const user = usuarios.find(u => u.email === email && u.senha === senha);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  }

  return { currentUser, login, logout };
} 