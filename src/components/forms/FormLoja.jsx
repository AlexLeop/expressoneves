import React from 'react';

export default function FormLoja({ lojaForm, setLojaForm, onSubmit, isEditing }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nome</label>
        <input
          type="text"
          value={lojaForm.nome}
          onChange={e => setLojaForm({ ...lojaForm, nome: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CNPJ</label>
        <input
          type="text"
          value={lojaForm.cnpj}
          onChange={e => setLojaForm({ ...lojaForm, cnpj: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Contato</label>
        <input
          type="text"
          value={lojaForm.contato}
          onChange={e => setLojaForm({ ...lojaForm, contato: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      {/* Adicione outros campos conforme necessário */}
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">
        {isEditing ? 'Salvar Alterações' : 'Cadastrar Loja'}
      </button>
    </form>
  );
} 