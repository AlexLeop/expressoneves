import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Loja } from '../types';

export function Lojas() {
  const { lojas, addLoja, updateLoja, deleteLoja } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingLoja, setEditingLoja] = useState<Loja | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    contato: '',
    valorCorridaAte5km: 0,
    valorCorridaAcima5km: 0,
    taxaAdministrativa: 0,
    taxaSupervisao: 0
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      cnpj: '',
      contato: '',
      valorCorridaAte5km: 0,
      valorCorridaAcima5km: 0,
      taxaAdministrativa: 0,
      taxaSupervisao: 0
    });
    setEditingLoja(null);
    setShowForm(false);
  };

  const handleEdit = (loja: Loja) => {
    setFormData({
      nome: loja.nome,
      cnpj: loja.cnpj,
      contato: loja.contato,
      valorCorridaAte5km: loja.valorCorridaAte5km,
      valorCorridaAcima5km: loja.valorCorridaAcima5km,
      taxaAdministrativa: loja.taxaAdministrativa,
      taxaSupervisao: loja.taxaSupervisao
    });
    setEditingLoja(loja);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingLoja) {
      updateLoja(editingLoja.id, formData);
    } else {
      addLoja(formData);
    }
    
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta loja?')) {
      deleteLoja(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Lojas</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nova Loja
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingLoja ? 'Editar Loja' : 'Nova Loja'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Loja
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
                  CNPJ
                </label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  className="input-field"
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contato
                </label>
                <input
                  type="text"
                  value={formData.contato}
                  onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                  className="input-field"
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Corrida ≤5km
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valorCorridaAte5km}
                    onChange={(e) => setFormData({ ...formData, valorCorridaAte5km: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Corrida {'>'}5km
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valorCorridaAcima5km}
                    onChange={(e) => setFormData({ ...formData, valorCorridaAcima5km: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taxa Administrativa
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.taxaAdministrativa}
                    onChange={(e) => setFormData({ ...formData, taxaAdministrativa: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taxa Supervisão
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.taxaSupervisao}
                    onChange={(e) => setFormData({ ...formData, taxaSupervisao: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    required
                  />
                </div>
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
                  {editingLoja ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lojas List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lojas.map((loja) => (
          <div key={loja.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{loja.nome}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(loja)}
                  className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(loja.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">CNPJ:</span>
                <span className="font-medium">{loja.cnpj}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contato:</span>
                <span className="font-medium">{loja.contato}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Corrida ≤5km:</span>
                <span className="font-medium text-green-600">
                  R$ {loja.valorCorridaAte5km.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Corrida {'>'}5km:</span>
                <span className="font-medium text-green-600">
                  R$ {loja.valorCorridaAcima5km.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxa Admin:</span>
                <span className="font-medium text-blue-600">
                  R$ {loja.taxaAdministrativa.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxa Supervisão:</span>
                <span className="font-medium text-blue-600">
                  R$ {loja.taxaSupervisao.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {lojas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhuma loja cadastrada ainda.</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary mt-4"
          >
            Cadastrar primeira loja
          </button>
        </div>
      )}
    </div>
  );
}