import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PlusIcon, CheckIcon, XMarkIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { Adiantamento } from '../types';

export function Adiantamentos() {
  const { adiantamentos, motoboys, lojas, currentUser, addAdiantamento, updateAdiantamento, deleteAdiantamento } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    motoboyId: '',
    lojaId: '',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    status: 'pendente' as 'pendente' | 'aprovado' | 'rejeitado'
  });

  const resetForm = () => {
    setFormData({
      motoboyId: '',
      lojaId: '',
      valor: 0,
      data: new Date().toISOString().split('T')[0],
      descricao: '',
      status: 'pendente'
    });
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAdiantamento(formData);
    resetForm();
  };

  const handleApprove = (id: string) => {
    updateAdiantamento(id, {
      status: 'aprovado',
      dataAprovacao: new Date().toISOString().split('T')[0],
      aprovadoPor: currentUser?.nome
    });
  };

  const handleReject = (id: string) => {
    updateAdiantamento(id, {
      status: 'rejeitado',
      dataAprovacao: new Date().toISOString().split('T')[0],
      aprovadoPor: currentUser?.nome
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este adiantamento?')) {
      deleteAdiantamento(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'bg-green-100 text-green-800';
      case 'rejeitado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const sortedAdiantamentos = adiantamentos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Adiantamentos</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Novo Adiantamento
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-50">
              <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">
                {adiantamentos.filter(a => a.status === 'pendente').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-50">
              <CheckIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aprovados</p>
              <p className="text-2xl font-bold text-gray-900">
                {adiantamentos.filter(a => a.status === 'aprovado').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-50">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Aprovado</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {adiantamentos
                  .filter(a => a.status === 'aprovado')
                  .reduce((sum, a) => sum + a.valor, 0)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Novo Adiantamento</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motoboy
                </label>
                <select
                  value={formData.motoboyId}
                  onChange={(e) => setFormData({ ...formData, motoboyId: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Selecione um motoboy</option>
                  {motoboys.filter(m => m.status === 'ativo').map(motoboy => (
                    <option key={motoboy.id} value={motoboy.id}>
                      {motoboy.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loja
                </label>
                <select
                  value={formData.lojaId}
                  onChange={(e) => setFormData({ ...formData, lojaId: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Selecione uma loja</option>
                  {lojas.map(loja => (
                    <option key={loja.id} value={loja.id}>
                      {loja.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Motivo do adiantamento..."
                  required
                />
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
                  Solicitar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adiantamentos List */}
      <div className="space-y-4">
        {sortedAdiantamentos.map((adiantamento) => {
          const motoboy = motoboys.find(m => m.id === adiantamento.motoboyId);
          const loja = lojas.find(l => l.id === adiantamento.lojaId);

          return (
            <div key={adiantamento.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                    <CurrencyDollarIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      R$ {adiantamento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {motoboy?.nome} - {loja?.nome}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(adiantamento.status)}`}>
                    {adiantamento.status}
                  </span>
                  {adiantamento.status === 'pendente' && currentUser?.tipo === 'admin' && (
                    <>
                      <button
                        onClick={() => handleApprove(adiantamento.id)}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Aprovar"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleReject(adiantamento.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Rejeitar"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Data da Solicitação:</span>
                  <p className="font-medium">
                    {new Date(adiantamento.data).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                {adiantamento.dataAprovacao && (
                  <div>
                    <span className="text-gray-600">Data da Aprovação:</span>
                    <p className="font-medium">
                      {new Date(adiantamento.dataAprovacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}

                {adiantamento.aprovadoPor && (
                  <div>
                    <span className="text-gray-600">Aprovado por:</span>
                    <p className="font-medium">{adiantamento.aprovadoPor}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-gray-600 text-sm">Descrição:</span>
                <p className="text-sm text-gray-900 mt-1">{adiantamento.descricao}</p>
              </div>
            </div>
          );
        })}
      </div>

      {adiantamentos.length === 0 && (
        <div className="text-center py-12">
          <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum adiantamento solicitado ainda.</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary mt-4"
          >
            Solicitar primeiro adiantamento
          </button>
        </div>
      )}
    </div>
  );
}