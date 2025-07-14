import React, { createContext, useContext, ReactNode } from 'react';
import { useStoredState } from '../hooks/useStoredState';
import { AppState, Loja, Motoboy, Jornada, Adiantamento, Colaborador } from '../types';

interface AppContextType extends AppState {
  // Lojas
  addLoja: (loja: Omit<Loja, 'id'>) => void;
  updateLoja: (id: string, loja: Partial<Loja>) => void;
  deleteLoja: (id: string) => void;
  
  // Motoboys
  addMotoboy: (motoboy: Omit<Motoboy, 'id'>) => void;
  updateMotoboy: (id: string, motoboy: Partial<Motoboy>) => void;
  deleteMotoboy: (id: string) => void;
  
  // Jornadas
  addJornada: (jornada: Omit<Jornada, 'id'>) => void;
  updateJornada: (id: string, jornada: Partial<Jornada>) => void;
  deleteJornada: (id: string) => void;
  
  // Adiantamentos
  addAdiantamento: (adiantamento: Omit<Adiantamento, 'id'>) => void;
  updateAdiantamento: (id: string, adiantamento: Partial<Adiantamento>) => void;
  deleteAdiantamento: (id: string) => void;
  
  // Colaboradores
  addColaborador: (colaborador: Omit<Colaborador, 'id'>) => void;
  updateColaborador: (id: string, colaborador: Partial<Colaborador>) => void;
  deleteColaborador: (id: string) => void;
  
  // Auth
  login: (email: string, senha: string) => boolean;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialData: AppState = {
  lojas: [
    {
      nome: "Baixo Araguaia Freguesia",
      cnpj: "99.999.999/9999-99",
      contato: "(21) 99999-9999",
      valorCorridaAte5km: 5,
      valorCorridaAcima5km: 8,
      taxaAdministrativa: 300,
      taxaSupervisao: 50,
      id: "1752514679056"
    }
  ],
  motoboys: [
    {
      nome: "Fábio Wendell",
      cpf: "999.999.999-99",
      telefone: "(21) 99999-9999",
      valorDiariaPadrao: 72,
      valorDiariaDomFeriado: 72,
      status: "ativo",
      id: "1752514729814"
    },
    {
      nome: "Sidnei Miranda",
      cpf: "999.999.999-99",
      telefone: "(99) 99999-9999",
      valorDiariaPadrao: 144,
      valorDiariaDomFeriado: 144,
      status: "ativo",
      id: "1752514763647"
    },
    {
      nome: "João César (free)",
      cpf: "999.999.999-99",
      telefone: "(99) 99999-9999",
      status: "ativo",
      id: "1752515982058"
    }
  ],
  jornadas: [],
  adiantamentos: [],
  colaboradores: [
    {
      id: "admin-001",
      nome: "Administrador",
      email: "admin@expressoneves.com",
      senha: "admin123",
      tipo: "admin",
      lojaId: null,
      ativo: true,
      dataCriacao: "2025-01-01"
    },
    {
      nome: "ALEX LEOPOLDO DA SILVA",
      email: "lx.leopoldo@gmail.com",
      senha: "Al147258@#",
      tipo: "admin",
      lojaId: null,
      ativo: true,
      id: "1752512250316",
      dataCriacao: "2025-07-14"
    }
  ],
  currentUser: null,
  isAuthenticated: false
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useStoredState<AppState>('expressoneves-data', initialData);

  const generateId = () => Date.now().toString();

  // Lojas
  const addLoja = (loja: Omit<Loja, 'id'>) => {
    const newLoja = { ...loja, id: generateId() };
    setState(prev => ({ ...prev, lojas: [...prev.lojas, newLoja] }));
  };

  const updateLoja = (id: string, updates: Partial<Loja>) => {
    setState(prev => ({
      ...prev,
      lojas: prev.lojas.map(loja => loja.id === id ? { ...loja, ...updates } : loja)
    }));
  };

  const deleteLoja = (id: string) => {
    setState(prev => ({
      ...prev,
      lojas: prev.lojas.filter(loja => loja.id !== id)
    }));
  };

  // Motoboys
  const addMotoboy = (motoboy: Omit<Motoboy, 'id'>) => {
    const newMotoboy = { ...motoboy, id: generateId() };
    setState(prev => ({ ...prev, motoboys: [...prev.motoboys, newMotoboy] }));
  };

  const updateMotoboy = (id: string, updates: Partial<Motoboy>) => {
    setState(prev => ({
      ...prev,
      motoboys: prev.motoboys.map(motoboy => motoboy.id === id ? { ...motoboy, ...updates } : motoboy)
    }));
  };

  const deleteMotoboy = (id: string) => {
    setState(prev => ({
      ...prev,
      motoboys: prev.motoboys.filter(motoboy => motoboy.id !== id)
    }));
  };

  // Jornadas
  const addJornada = (jornada: Omit<Jornada, 'id'>) => {
    const newJornada = { ...jornada, id: generateId() };
    setState(prev => ({ ...prev, jornadas: [...prev.jornadas, newJornada] }));
  };

  const updateJornada = (id: string, updates: Partial<Jornada>) => {
    setState(prev => ({
      ...prev,
      jornadas: prev.jornadas.map(jornada => jornada.id === id ? { ...jornada, ...updates } : jornada)
    }));
  };

  const deleteJornada = (id: string) => {
    setState(prev => ({
      ...prev,
      jornadas: prev.jornadas.filter(jornada => jornada.id !== id)
    }));
  };

  // Adiantamentos
  const addAdiantamento = (adiantamento: Omit<Adiantamento, 'id'>) => {
    const newAdiantamento = { ...adiantamento, id: generateId() };
    setState(prev => ({ ...prev, adiantamentos: [...prev.adiantamentos, newAdiantamento] }));
  };

  const updateAdiantamento = (id: string, updates: Partial<Adiantamento>) => {
    setState(prev => ({
      ...prev,
      adiantamentos: prev.adiantamentos.map(adiantamento => 
        adiantamento.id === id ? { ...adiantamento, ...updates } : adiantamento
      )
    }));
  };

  const deleteAdiantamento = (id: string) => {
    setState(prev => ({
      ...prev,
      adiantamentos: prev.adiantamentos.filter(adiantamento => adiantamento.id !== id)
    }));
  };

  // Colaboradores
  const addColaborador = (colaborador: Omit<Colaborador, 'id'>) => {
    const newColaborador = { 
      ...colaborador, 
      id: generateId(),
      dataCriacao: new Date().toISOString().split('T')[0]
    };
    setState(prev => ({ ...prev, colaboradores: [...prev.colaboradores, newColaborador] }));
  };

  const updateColaborador = (id: string, updates: Partial<Colaborador>) => {
    setState(prev => ({
      ...prev,
      colaboradores: prev.colaboradores.map(colaborador => 
        colaborador.id === id ? { ...colaborador, ...updates } : colaborador
      )
    }));
  };

  const deleteColaborador = (id: string) => {
    setState(prev => ({
      ...prev,
      colaboradores: prev.colaboradores.filter(colaborador => colaborador.id !== id)
    }));
  };

  // Auth
  const login = (email: string, senha: string): boolean => {
    const user = state.colaboradores.find(c => c.email === email && c.senha === senha && c.ativo);
    if (user) {
      setState(prev => ({ ...prev, currentUser: user, isAuthenticated: true }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null, isAuthenticated: false }));
  };

  const value: AppContextType = {
    ...state,
    addLoja,
    updateLoja,
    deleteLoja,
    addMotoboy,
    updateMotoboy,
    deleteMotoboy,
    addJornada,
    updateJornada,
    deleteJornada,
    addAdiantamento,
    updateAdiantamento,
    deleteAdiantamento,
    addColaborador,
    updateColaborador,
    deleteColaborador,
    login,
    logout
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}