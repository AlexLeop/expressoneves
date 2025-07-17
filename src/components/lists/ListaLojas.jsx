import React from 'react';

export default function ListaLojas({ lojas }) {
  return (
    <div className="bg-white rounded-lg shadow">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">CNPJ</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
          </tr>
        </thead>
        <tbody>
          {lojas.map((loja, idx) => (
            <tr key={idx} className="border-b">
              <td className="px-3 py-2 text-sm">{loja.nome}</td>
              <td className="px-3 py-2 text-sm">{loja.cnpj}</td>
              <td className="px-3 py-2 text-sm">{loja.contato}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 