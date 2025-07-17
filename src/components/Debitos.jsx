import React from 'react';

export default function Debitos({ debitosPendentes }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Débitos Pendentes</h2>
      </div>
      {/* Formulário de cadastro e lista de débitos */}
      {/* Adicione aqui o restante do conteúdo da aba Débitos */}
      {debitosPendentes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum débito cadastrado ainda.
        </div>
      )}
    </div>
  );
} 