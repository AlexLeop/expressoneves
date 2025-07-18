import React, { createContext, useContext, useState, useEffect } from 'react';
import * as db from '../services/database.js';
import toast from 'react-hot-toast';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export function AppProvider({ children }) {
  const [data, setData] = useState({
    motoboys: [],
    lojas: [],
    jornadas: [],
    adiantamentos: [],
    colaboradores: [],
    debitosPendentes: []
  });

  const [loading, setLoading] = useState(true);

  // Carregar dados do Supabase na inicialização
  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      const [motoboys, lojas, jornadas, adiantamentos, colaboradores, debitosPendentes] = await Promise.all([
        db.getMotoboys(),
        db.getLojas(),
        db.getJornadas(),
        db.getAdiantamentos(),
        db.getColaboradores(),
        db.getDebitosPendentes()
      ]);

      setData({
        motoboys,
        lojas,
        jornadas,
        adiantamentos,
        colaboradores,
        debitosPendentes
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do sistema');
    } finally {
      setLoading(false);
    }
  }

  // Motoboys
  const addMotoboy = async (motoboy) => {
    try {
      const newMotoboy = await db.createMotoboy(motoboy);
      setData(prev => ({ ...prev, motoboys: [...prev.motoboys, newMotoboy] }));
      toast.success('Motoboy cadastrado com sucesso!');
      return newMotoboy;
    } catch (error) {
      console.error('Erro ao cadastrar motoboy:', error);
      toast.error('Erro ao cadastrar motoboy');
      throw error;
    }
  };

  const updateMotoboy = async (id, updatedMotoboy) => {
    try {
      const updated = await db.updateMotoboy(id, updatedMotoboy);
      setData(prev => ({
        ...prev,
        motoboys: prev.motoboys.map(m => m.id === id ? updated : m)
      }));
      toast.success('Motoboy atualizado com sucesso!');
      return updated;
    } catch (error) {
      console.error('Erro ao atualizar motoboy:', error);
      toast.error('Erro ao atualizar motoboy');
      throw error;
    }
  };

  const deleteMotoboy = async (id) => {
    try {
      await db.deleteMotoboy(id);
      setData(prev => ({ ...prev, motoboys: prev.motoboys.filter(m => m.id !== id) }));
      toast.success('Motoboy removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover motoboy:', error);
      toast.error('Erro ao remover motoboy');
      throw error;
    }
  };

  // Lojas
  const addLoja = async (loja) => {
    try {
      const newLoja = await db.createLoja(loja);
      setData(prev => ({ ...prev, lojas: [...prev.lojas, newLoja] }));
      toast.success('Loja cadastrada com sucesso!');
      return newLoja;
    } catch (error) {
      console.error('Erro ao cadastrar loja:', error);
      toast.error('Erro ao cadastrar loja');
      throw error;
    }
  };

  const updateLoja = async (id, updatedLoja) => {
    try {
      const updated = await db.updateLoja(id, updatedLoja);
      setData(prev => ({
        ...prev,
        lojas: prev.lojas.map(l => l.id === id ? updated : l)
      }));
      toast.success('Loja atualizada com sucesso!');
      return updated;
    } catch (error) {
      console.error('Erro ao atualizar loja:', error);
      toast.error('Erro ao atualizar loja');
      throw error;
    }
  };

  const deleteLoja = async (id) => {
    try {
      await db.deleteLoja(id);
      setData(prev => ({ ...prev, lojas: prev.lojas.filter(l => l.id !== id) }));
      toast.success('Loja removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover loja:', error);
      toast.error('Erro ao remover loja');
      throw error;
    }
  };

  // Jornadas
  const addJornada = async (jornada) => {
    try {
      const newJornada = await db.createJornada(jornada);
      setData(prev => ({ ...prev, jornadas: [...prev.jornadas, newJornada] }));
      toast.success('Jornada cadastrada com sucesso!');
      return newJornada;
    } catch (error) {
      console.error('Erro ao cadastrar jornada:', error);
      toast.error('Erro ao cadastrar jornada');
      throw error;
    }
  };

  const updateJornada = async (id, updatedJornada) => {
    try {
      const updated = await db.updateJornada(id, updatedJornada);
      setData(prev => ({
        ...prev,
        jornadas: prev.jornadas.map(j => j.id === id ? updated : j)
      }));
      toast.success('Jornada atualizada com sucesso!');
      return updated;
    } catch (error) {
      console.error('Erro ao atualizar jornada:', error);
      toast.error('Erro ao atualizar jornada');
      throw error;
    }
  };

  const deleteJornada = async (id) => {
    try {
      await db.deleteJornada(id);
      setData(prev => ({ ...prev, jornadas: prev.jornadas.filter(j => j.id !== id) }));
      toast.success('Jornada removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover jornada:', error);
      toast.error('Erro ao remover jornada');
      throw error;
    }
  };

  // Adiantamentos
  const addAdiantamento = async (adiantamento) => {
    try {
      const newAdiantamento = await db.createAdiantamento(adiantamento);
      setData(prev => ({ ...prev, adiantamentos: [...prev.adiantamentos, newAdiantamento] }));
      toast.success('Adiantamento cadastrado com sucesso!');
      return newAdiantamento;
    } catch (error) {
      console.error('Erro ao cadastrar adiantamento:', error);
      toast.error('Erro ao cadastrar adiantamento');
      throw error;
    }
  };

  const updateAdiantamento = async (id, updatedAdiantamento) => {
    try {
      const updated = await db.updateAdiantamento(id, updatedAdiantamento);
      setData(prev => ({
        ...prev,
        adiantamentos: prev.adiantamentos.map(a => a.id === id ? updated : a)
      }));
      toast.success('Adiantamento atualizado com sucesso!');
      return updated;
    } catch (error) {
      console.error('Erro ao atualizar adiantamento:', error);
      toast.error('Erro ao atualizar adiantamento');
      throw error;
    }
  };

  const deleteAdiantamento = async (id) => {
    try {
      await db.deleteAdiantamento(id);
      setData(prev => ({ ...prev, adiantamentos: prev.adiantamentos.filter(a => a.id !== id) }));
      toast.success('Adiantamento removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover adiantamento:', error);
      toast.error('Erro ao remover adiantamento');
      throw error;
    }
  };

  // Colaboradores
  const addColaborador = async (colaborador) => {
    try {
      const newColaborador = await db.createColaborador(colaborador);
      setData(prev => ({ ...prev, colaboradores: [...prev.colaboradores, newColaborador] }));
      toast.success('Colaborador cadastrado com sucesso!');
      return newColaborador;
    } catch (error) {
      console.error('Erro ao cadastrar colaborador:', error);
      toast.error('Erro ao cadastrar colaborador');
      throw error;
    }
  };

  const updateColaborador = async (id, updatedColaborador) => {
    try {
      const updated = await db.updateColaborador(id, updatedColaborador);
      setData(prev => ({
        ...prev,
        colaboradores: prev.colaboradores.map(c => c.id === id ? updated : c)
      }));
      toast.success('Colaborador atualizado com sucesso!');
      return updated;
    } catch (error) {
      console.error('Erro ao atualizar colaborador:', error);
      toast.error('Erro ao atualizar colaborador');
      throw error;
    }
  };

  const deleteColaborador = async (id) => {
    try {
      await db.deleteColaborador(id);
      setData(prev => ({ ...prev, colaboradores: prev.colaboradores.filter(c => c.id !== id) }));
      toast.success('Colaborador removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover colaborador:', error);
      toast.error('Erro ao remover colaborador');
      throw error;
    }
  };

  // Débitos Pendentes
  const addDebitoPendente = async (debito) => {
    try {
      const newDebito = await db.createDebitoPendente(debito);
      setData(prev => ({ ...prev, debitosPendentes: [...prev.debitosPendentes, newDebito] }));
      toast.success('Débito cadastrado com sucesso!');
      return newDebito;
    } catch (error) {
      console.error('Erro ao cadastrar débito:', error);
      toast.error('Erro ao cadastrar débito');
      throw error;
    }
  };

  const updateDebitoPendente = async (id, updatedDebito) => {
    try {
      const updated = await db.updateDebitoPendente(id, updatedDebito);
      setData(prev => ({
        ...prev,
        debitosPendentes: prev.debitosPendentes.map(d => d.id === id ? updated : d)
      }));
      toast.success('Débito atualizado com sucesso!');
      return updated;
    } catch (error) {
      console.error('Erro ao atualizar débito:', error);
      toast.error('Erro ao atualizar débito');
      throw error;
    }
  };

  const deleteDebitoPendente = async (id) => {
    try {
      await db.deleteDebitoPendente(id);
      setData(prev => ({ ...prev, debitosPendentes: prev.debitosPendentes.filter(d => d.id !== id) }));
      toast.success('Débito removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover débito:', error);
      toast.error('Erro ao remover débito');
      throw error;
    }
  };

  return (
    <AppContext.Provider value={{
      data,
      loading,
      loadAllData,
      // Motoboys
      addMotoboy,
      updateMotoboy,
      deleteMotoboy,
      // Lojas
      addLoja,
      updateLoja,
      deleteLoja,
      // Jornadas
      addJornada,
      updateJornada,
      deleteJornada,
      // Adiantamentos
      addAdiantamento,
      updateAdiantamento,
      deleteAdiantamento,
      // Colaboradores
      addColaborador,
      updateColaborador,
      deleteColaborador,
      // Débitos Pendentes
      addDebitoPendente,
      updateDebitoPendente,
      deleteDebitoPendente
    }}>
      {children}
    </AppContext.Provider>
  );
}