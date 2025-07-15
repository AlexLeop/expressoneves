import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PlusIcon, PencilIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Jornada } from '../types';

export function Jornadas() {
  const { jornadas, motoboys, lojas, addJornada, updateJornada, deleteJornada } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingJornada, setEditingJornada] = useState<Jornada | null>(null);
  const [formData, setFormData] = useState({
    data: '',
    motoboyId: '',
    lojaId: '',
    horasEntrada: '',
    horasSaida: '',
    valorDiaria: 0,
    corridasAte5km: 0,
    corridasAcima5km: 0,
    comissoes: 0,
    missoes: 0,
    eFeriado: false,
    observacoes: ''
  });

  const resetForm = () => {
    setFormData({
      data: '',
      motoboyId: '',
      lojaId: '',
      horasEntrada: '',
      horasSaida: '',
      valorDiaria: 0,
      corridasAte5km: 0,
      corridasAcima5km: 0,
      comissoes: 0,
      missoes: 0,
      eFeriado: false,
      observacoes: ''
    });
    setEditingJornada(null);
    setShowForm(false);
  };

  const handleEdit = (jornada: Jornada) => {
    setFormData({
      data: jornada.data,
      motoboyId: jornada.motoboyId,
      lojaId: jornada.lojaId,
      horasEntrada: jornada.horasEntrada,
      horasSaida: jornada.horasSaida,
      valorDiaria: jornada.valorDiaria,
      corridasAte5km: jornada.corridasAte5km,
      corridasAcima5km: jornada.corridasAcima5km,
      comissoes: jornada.comissoes,
      missoes: jornada.missoes,
      eFeriado: jornada.eFeriado,
      observacoes: jornada.observacoes
    });
    setEditingJornada(jornada);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingJornada) {
      updateJornada(editingJornada.id, formData);
    } else {
      addJornada(formData);
    }
    
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta jornada?')) {
      deleteJornada(id);
    }
  };

  const calculateHours = (entrada: string, saida: string) => {
    if (!entrada || !saida) return 0;
    
    const [entradaHour, entradaMin] = entrada.split(':').map(Number);
    const [saidaHour, saidaMin] = saida.split(':').map(Number);
    
    const entradaMinutes = entradaHour * 60 + entradaMin;
    const saidaMinutes = saidaHour * 60 + saidaMin;
    
    return ((saidaMinutes - entradaMinutes) / 60).toFixed(1);
  };

  const sortedJornadas = jornadas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Jornadas</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nova Jornada
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingJornada ? 'Editar Jornada' : 'Nova Jornada'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Valor Diária
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valorDiaria}
                    onChange={(e) => setFormData({ ...formData, valorDiaria: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Entrada
                  </label>
                  <input
                    type="time"
                    value={formData.horasEntrada}
                    onChange={(e) => setFormData({ ...formData, horasEntrada: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Saída
                  </label>
                  <input
                    type="time"
                    value={formData.horasSaida}
                    onChange={(e) => setFormData({ ...formData, horasSaida: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Corridas ≤5km
                  </label>
                  <input
                    type="number"
                    value={formData.corridasAte5km}
                    onChange={(e) => setFormData({ ...formData, corridasAte5km: parseInt(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Corridas {'>'}5km
                  </label>
                  <input
                    type="number"
                    value={formData.corridasAcima5km}
                    onChange={(e) => setFormData({ ...formData, corridasAcima5km: parseInt(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comissões
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.comissoes}
                    onChange={(e) => setFormData({ ...formData, comissoes: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Missões
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.missoes}
                    onChange={(e) => setFormData({ ...formData, missoes: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="eFeriado"
                  checked={formData.eFeriado}
                  onChange={(e) => setFormData({ ...formData, eFeriado: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="eFeriado" className="ml-2 block text-sm text-gray-900">
                  É feriado
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Observações sobre a jornada..."
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
                  {editingJornada ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Jornadas List */}
      <div className="space-y-4">
        {sortedJornadas.map((jornada) => {
          const motoboy = motoboys.find(m => m.id === jornada.motoboyId);
          const loja = lojas.find(l => l.id === jornada.lojaId);
          const totalCorridas = jornada.corridasAte5km + jornada.corridasAcima5km;
          const horasTrabalhadas = calculateHours(jornada.horasEntrada, jornada.horasSaida);

          return (
            <div key={jornada.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                    <ClockIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {new Date(jornada.data).toLocaleDateString('pt-BR')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {motoboy?.nome} - {loja?.nome}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {jornada.eFeriado && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      Feriado
                    </span>
                  )}
                  <button
                    onClick={() => handleEdit(jornada)}
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(jornada.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Horário:</span>
                  <p className="font-medium">
                    {jornada.horasEntrada} - {jornada.horasSaida}
                  </p>
                  <p className="text-xs text-gray-500">{horasTrabalhadas}h trabalhadas</p>
                </div>

                <div>
                  <span className="text-gray-600">Diária:</span>
                  <p className="font-medium text-green-600">
                    R$ {jornada.valorDiaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <span className="text-gray-600">Corridas:</span>
                  <p className="font-medium text-blue-600">{totalCorridas} total</p>
                  <p className="text-xs text-gray-500">
                    {jornada.corridasAte5km} ≤5km, {jornada.corridasAcima5km} {'>'}5km
                  </p>
                </div>

                <div>
                  <span className="text-gray-600">Extras:</span>
                  <p className="font-medium">
                    Comissões: R$ {jornada.comissoes.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Missões: R$ {jornada.missoes.toFixed(2)}
                  </p>
                </div>
              </div>

              {jornada.observacoes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-gray-600 text-sm">Observações:</span>
                  <p className="text-sm text-gray-900 mt-1">{jornada.observacoes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {jornadas.length === 0 && (
        <div className="text-center py-12">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma jornada registrada ainda.</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary mt-4"
          >
            Registrar primeira jornada
          </button>
        </div>
      )}
    </div>
  );
}