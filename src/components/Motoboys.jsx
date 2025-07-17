import React from 'react';

export default function Motoboys({ filtrosMotoboy, setFiltrosMotoboy, motoboysFiltrados, motoboys }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Motoboys</h2>
      </div>
      {/* Seção de Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
            <input
              type="text"
              value={filtrosMotoboy.nome}
              onChange={(e) => setFiltrosMotoboy({...filtrosMotoboy, nome: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Buscar por nome..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select 
              value={filtrosMotoboy.status}
              onChange={(e) => setFiltrosMotoboy({...filtrosMotoboy, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>
      </div>
      {/* Adicione aqui o restante do conteúdo da lista de motoboys */}
      {motoboysFiltrados.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {motoboys.length === 0 ? 'Nenhum motoboy cadastrado ainda.' : 'Nenhum motoboy encontrado com os filtros aplicados.'}
        </div>
      )}
    </div>
  );
} 