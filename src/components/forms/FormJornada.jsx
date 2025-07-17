import React from 'react';

export default function FormJornada({ jornadaForm, setJornadaForm, onSubmit, isEditing }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Data</label>
        <input
          type="date"
          value={jornadaForm.data}
          onChange={e => setJornadaForm({ ...jornadaForm, data: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Motoboy</label>
        <input
          type="text"
          value={jornadaForm.motoboyId}
          onChange={e => setJornadaForm({ ...jornadaForm, motoboyId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Loja</label>
        <input
          type="text"
          value={jornadaForm.lojaId}
          onChange={e => setJornadaForm({ ...jornadaForm, lojaId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>
      {/* Adicione outros campos conforme necessário */}
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">
        {isEditing ? 'Salvar Alterações' : 'Cadastrar Jornada'}
      </button>
    </form>
  );
} 