import React from 'react';

export default function Jornadas({ jornadas, jornadasFiltradas, showJornadaForm, cadastroMultiplo, editingJornada }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Jornadas</h2>
      </div>
      {/* Formulário de cadastro, lista de jornadas e controles de múltiplo cadastro */}
      {/* Adicione aqui o restante do conteúdo da aba Jornadas */}
      {jornadasFiltradas.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {jornadas.length === 0 ? 'Nenhuma jornada cadastrada ainda.' : 'Nenhuma jornada encontrada com os filtros aplicados.'}
        </div>
      )}
    </div>
  );
} 