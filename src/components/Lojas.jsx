import React from 'react';

export default function Lojas({ editingLoja, lojas }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Lojas</h2>
      </div>
      {/* Formulário de cadastro e lista de lojas */}
      {/* Adicione aqui o restante do conteúdo da aba Lojas */}
      {lojas.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhuma loja cadastrada ainda.
        </div>
      )}
    </div>
  );
} 