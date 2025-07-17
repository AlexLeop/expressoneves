import React from 'react';

export default function ListaJornadas({ jornadasFiltradas }) {
  return (
    <div className="bg-white rounded-lg shadow">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Motoboy</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Loja</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor Diária</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor Corridas</th>
          </tr>
        </thead>
        <tbody>
          {jornadasFiltradas.map((jornada, idx) => (
            <tr key={idx} className="border-b">
              <td className="px-3 py-2 text-sm">{jornada.data}</td>
              <td className="px-3 py-2 text-sm">{jornada.motoboyId}</td>
              <td className="px-3 py-2 text-sm">{jornada.lojaId}</td>
              <td className="px-3 py-2 text-sm">R$ {jornada.valorDiaria?.toFixed(2)}</td>
              <td className="px-3 py-2 text-sm">R$ {jornada.valorCorridas?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 