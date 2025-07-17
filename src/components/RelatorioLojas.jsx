import React from 'react';

export default function RelatorioLojas({ relatorioLojas }) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Relatório Lojas</h2>
      {/* Adicione aqui o restante do conteúdo da aba Relatório Lojas */}
      {relatorioLojas.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhuma jornada encontrada para o período selecionado.
        </div>
      )}
    </div>
  );
} 