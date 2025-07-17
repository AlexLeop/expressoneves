import React from 'react';

export default function ListaMotoboys({ motoboysFiltrados }) {
  return (
    <div className="bg-white rounded-lg shadow">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">CPF</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody>
          {motoboysFiltrados.map((motoboy, idx) => (
            <tr key={idx} className="border-b">
              <td className="px-3 py-2 text-sm">{motoboy.nome}</td>
              <td className="px-3 py-2 text-sm">{motoboy.cpf}</td>
              <td className="px-3 py-2 text-sm">{motoboy.telefone}</td>
              <td className="px-3 py-2 text-sm">{motoboy.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 