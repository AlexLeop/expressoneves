import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PlusIcon, PencilIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';
import { Colaborador } from '../types';

export function Colaboradores() {
  const { colaboradores, lojas, currentUser, addColaborador, updateColaborador, deleteColaborador } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    tipo: 'operador' as 'admin' | 'operador',
    lojaId: '',
    ativo: true
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      tipo: 'operador',
      lojaId: '',
      ativo: true
    });
    setEditingColaborador(null);
    setShowForm(false);
  };

  const handleEdit = (colaborador: Colaborador) => {
    setFormData({
      nome: colaborador.nome,
      email: colaborador.email,
      senha: colaborador.senha,
      tipo: colaborador.tipo,
      lojaId: colaborador.lojaId || '',
      ativo: colaborador.ativo
    });
    setEditingColaborador(colaborador);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const colaboradorData = {
      ...formData,
      lojaId: formData.lojaId || null
    };
    
    if (editingColaborador) {
      updateColaborador(editingColaborador.id, colaboradorData);
    } else {
      addColaborador(colaboradorData);
    }
    
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (id === currentUser?.id) {
      alert('Você não pode excluir seu próprio usuário.');
      return;
    }
    
    if (window.confirm('Tem certeza que deseja excluir este colaborador?')) {
      deleteColaborador(id);
    }
  };

  const toggleStatus = (colaborador: Colaborador) => {
    if (colaborador.id === currentUser?.id) {
      alert('Você não pode desativar seu próprio usuário.');
      return;
    }
    
    updateColaborador(colaborador.id, { ativo: !colaborador.ativo });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Colaboradores</h2>
        {currentUser?.tipo === 'admin' && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Novo Colaborador
          </button>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingColaborador ? 'Editar Colaborador' : 'Novo Colaborador'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className="input-field"
                  required={!editingColaborador}
                  placeholder={editingColaborador ? 'Deixe em branco para manter a senha atual' : ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Usuário
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'admin' | 'operador' })}
                  className="input-field"
                  required
                >
                  <option value="operador">Operador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loja (Opcional)
                </label>
                <select
                  value={formData.lojaId}
                  onChange={(e) => setFormData({ ...formData, lojaId: e.target.value })}
                  className="input-field"
                >
                  <option value="">Todas as lojas</option>
                  {lojas.map(loja => (
                    <option key={loja.id} value={loja.id}>
                      {loja.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
                  Usuário ativo
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingColaborador ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Colaboradores List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {colaboradores.map((colaborador) => {
          const loja = colaborador.lojaId ? lojas.find(l => l.id === colaborador.lojaId) : null;
          const isCurrentUser = colaborador.id === currentUser?.id;

          return (
            <div key={colaborador.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                    <UserIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {colaborador.nome}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                          Você
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        colaborador.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {colaborador.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        colaborador.tipo === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {colaborador.tipo === 'admin' ? 'Admin' : 'Operador'}
                      </span>
                    </div>
                  </div>
                </div>
                {currentUser?.tipo === 'admin' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(colaborador)}
                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    {!isCurrentUser && (
                      <button
                        onClick={() => handleDelete(colaborador.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{colaborador.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Loja:</span>
                  <span className="font-medium">
                    {loja ? loja.nome : 'Todas as lojas'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Criado em:</span>
                  <span className="font-medium">
                    {new Date(colaborador.dataCriacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {currentUser?.tipo === 'admin' && !isCurrentUser && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => toggleStatus(colaborador)}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      colaborador.ativo
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {colaborador.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {colaboradores.length === 0 && (
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum colaborador cadastrado ainda.</p>
          {currentUser?.tipo === 'admin' && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary mt-4"
            >
              Cadastrar primeiro colaborador
            </button>
          )}
        </div>
      )}
    </div>
  );
}