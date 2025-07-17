import React from 'react';

export default function Dashboard({ relatorioConfig, setRelatorioConfig }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Visão geral da operação Expresso Neves</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Período:</span>
            <input
              type="date"
              value={relatorioConfig.dataInicio}
              onChange={(e) => setRelatorioConfig({...relatorioConfig, dataInicio: e.target.value})}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-sm text-gray-600">até</span>
            <input
              type="date"
              value={relatorioConfig.dataFim}
              onChange={(e) => setRelatorioConfig({...relatorioConfig, dataFim: e.target.value})}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>
      {/* Adicione aqui o restante do conteúdo do Dashboard */}
    </div>
  );
} 