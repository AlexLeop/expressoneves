import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PlusIcon, PencilIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';
import { Motoboy } from '../types';

export function Motoboys() {
  const { motoboys, addMotoboy, updateMotoboy, deleteMotoboy } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingMotoboy, setEditingMotoboy] = useState<Motoboy | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    valorDiariaPadrao: 0,
    valorDiariaDomFeriado: 0,
    status: 'ativo' as 'ativo' | 'inativo'
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      cpf: '',
      telefone: '',
      valorDiariaPadrao: 0,
      valorDiariaDomFeriado: 0,
      status: 'ativo'
    });
    setEditingMotoboy(null);
    setShowForm(false);
  };

  const handleEdit = (motoboy: Motoboy) => {
    setFormData({
      nome: motoboy.nome,
      cpf: motoboy.cpf,
      telefone: motoboy.telefone,
      valorDiariaPadrao: motoboy.valorDiariaPadrao || 0,
      valorDiariaDomFeriado: motoboy.valorDiariaDomFeriado || 0,
      status: motoboy.status
    });
    setEditingMotoboy(motoboy);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMotoboy) {
      updateMotoboy(editingMotoboy.id, formData);
    } else {
      addMotoboy(formData);
    }
    
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este motoboy?')) {
      deleteMotoboy(id);
    }
  };

  const toggleStatus = (motoboy: Motoboy) => {
    updateMotoboy(motoboy.id, { 
      status: motoboy.status === 'ativo' ? 'inativo' : 'ativo' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Motoboys</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Novo Motoboy
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingMotoboy ? 'Editar Motoboy' : 'Novo Motoboy'}
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
                  CPF
                </label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="input-field"
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="input-field"
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Diária Padrão
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valorDiariaPadrao}
                  onChange={(e) => setFormData({ ...formData, valorDiariaPadrao: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Diária Dom/Feriado
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valorDiariaDomFeriado}
                  onChange={(e) => setFormData({ ...formData, valorDiariaDomFeriado: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ativo' | 'inativo' })}
                  className="input-field"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
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
                  {editingMotoboy ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Motoboys List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {motoboys.map((motoboy) => (
          <div key={motoboy.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                  <UserIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{motoboy.nome}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    motoboy.status === 'ativo' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {motoboy.status}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(motoboy)}
                  className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(motoboy.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">CPF:</span>
                <span className="font-medium">{motoboy.cpf}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Telefone:</span>
                <span className="font-medium">{motoboy.telefone}</span>
              </div>
              {motoboy.valorDiariaPadrao && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Diária Padrão:</span>
                  <span className="font-medium text-green-600">
                    R$ {motoboy.valorDiariaPadrao.toFixed(2)}
                  </span>
                </div>
              )}
              {motoboy.valorDiariaDomFeriado && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Diária Dom/Feriado:</span>
                  <span className="font-medium text-green-600">
                    R$ {motoboy.valorDiariaDomFeriado.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => toggleStatus(motoboy)}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  motoboy.status === 'ativo'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {motoboy.status === 'ativo' ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {motoboys.length === 0 && (
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum motoboy cadastrado ainda.</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary mt-4"
          >
            Cadastrar primeiro motoboy
          </button>
        </div>
      )}
    </div>
  );
}