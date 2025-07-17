import React from 'react';

export default function FormMotoboy({ motoboyForm, setMotoboyForm, onSubmit, isEditing }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nome</label>
        <input
          type="text"
          value={motoboyForm.nome}
          onChange={e => setMotoboyForm({ ...motoboyForm, nome: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CPF</label>
        <input
          type="text"
          value={motoboyForm.cpf}
          onChange={e => setMotoboyForm({ ...motoboyForm, cpf: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Telefone</label>
        <input
          type="text"
          value={motoboyForm.telefone}
          onChange={e => setMotoboyForm({ ...motoboyForm, telefone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <select
          value={motoboyForm.status}
          onChange={e => setMotoboyForm({ ...motoboyForm, status: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">
        {isEditing ? 'Salvar Alterações' : 'Cadastrar Motoboy'}
      </button>
    </form>
  );
} 