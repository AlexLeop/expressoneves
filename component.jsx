import React, { useState, useEffect } from 'react';
import { PlusCircle, Users, Store, Calendar, DollarSign, FileText, Settings, Eye, Edit, Trash2, Download, Upload } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const { useStoredState } = hatch;

const MotoboysSystem = () => {
  // Estados de autenticação
  const [isAuthenticated, setIsAuthenticated] = useStoredState('isAuthenticated', false);
  const [currentUser, setCurrentUser] = useStoredState('currentUser', null);
  const [colaboradores, setColaboradores] = useStoredState('colaboradores', [
    {
      id: 'admin-001',
      nome: 'Administrador',
      email: 'admin@expressoneves.com',
      senha: 'admin123',
      tipo: 'admin',
      lojaId: null,
      ativo: true,
      dataCriacao: '2025-01-01'
    }
  ]);

  // Estados principais
  const [activeTab, setActiveTab] = useState('dashboard');
  const [motoboys, setMotoboys] = useStoredState('motoboys', []);
  const [lojas, setLojas] = useStoredState('lojas', []);
  const [jornadas, setJornadas] = useStoredState('jornadas', []);
  const [adiantamentos, setAdiantamentos] = useStoredState('adiantamentos', []);
  const [debitosPendentes, setDebitosPendentes] = useStoredState('debitosPendentes', []);
  const [supervisao, setSupervisao] = useStoredState('supervisao', []);
  const [selectedWeek, setSelectedWeek] = useState('2025-01-13');

  // Modais
  const [showMotoboyModal, setShowMotoboyModal] = useState(false);
  const [showLojaModal, setShowLojaModal] = useState(false);
  const [showJornadaModal, setShowJornadaModal] = useState(false);
  const [showAdiantamentoModal, setShowAdiantamentoModal] = useState(false);
  const [showColaboradorModal, setShowColaboradorModal] = useState(false);
  const [showDebitoModal, setShowDebitoModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Funções de autenticação
  const login = (email, senha) => {
    const colaborador = colaboradores.find(c => 
      c.email === email && 
      c.senha === senha && 
      c.ativo
    );
    
    if (colaborador) {
      setCurrentUser(colaborador);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // Funções de permissão
  const hasPermission = (action) => {
    if (!currentUser) return false;
    
    const permissions = {
      admin: {
        viewDashboard: true,
        manageMotoboys: true,
        manageLojas: true,
        manageJornadas: true,
        manageAdiantamentos: true,
        viewRelatorios: true,
        manageColaboradores: true
      },
      financeiro: {
        viewDashboard: true,
        manageMotoboys: true,
        manageLojas: false, // Não pode criar/editar lojas
        manageJornadas: true,
        manageAdiantamentos: true,
        viewRelatorios: true,
        manageColaboradores: false
      },
      lojista: {
        viewDashboard: true,
        manageMotoboys: false,
        manageLojas: false,
        manageJornadas: true, // Apenas para sua loja
        manageAdiantamentos: true, // Apenas para sua loja
        viewRelatorios: true, // Apenas para sua loja
        manageColaboradores: false
      }
    };

    return permissions[currentUser.tipo]?.[action] || false;
  };

  const canAccessLoja = (lojaId) => {
    if (!currentUser) return false;
    if (currentUser.tipo === 'admin' || currentUser.tipo === 'financeiro') return true;
    if (currentUser.tipo === 'lojista') return currentUser.lojaId === lojaId;
    return false;
  };

  // Função para formatar CPF
  const formatCPF = (value) => {
    if (!value) return '';
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  // Função para formatar CNPJ
  const formatCNPJ = (value) => {
    if (!value) return '';
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  // Função para formatar telefone
  const formatPhone = (value) => {
    if (!value) return '';
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  // Função para formatar data no padrão brasileiro (dd/mm/aaaa)
  const formatDateBR = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); // Adiciona horário para evitar problemas de timezone
    return date.toLocaleDateString('pt-BR');
  };

  // Função para verificar se é domingo ou feriado
  const isDomingoOuFeriado = (data, eFeriado) => {
    const dayOfWeek = new Date(data).getDay();
    return dayOfWeek === 0 || eFeriado;
  };

  // Função para calcular horas trabalhadas (CORRIGIDA)
  const calcularHorasTrabalhadas = (horaEntrada, horaSaida) => {
    if (!horaEntrada || !horaSaida) return 0;
    
    const [horaE, minutoE] = horaEntrada.split(':').map(Number);
    const [horaS, minutoS] = horaSaida.split(':').map(Number);
    
    let minutosEntrada = horaE * 60 + minutoE;
    let minutosSaida = horaS * 60 + minutoS;
    
    // Se a hora de saída for menor que a de entrada, significa que passou da meia-noite
    if (minutosSaida < minutosEntrada) {
      minutosSaida += 24 * 60; // Adiciona 24 horas em minutos
    }
    
    const totalMinutos = minutosSaida - minutosEntrada;
    return totalMinutos / 60;
  };

  // Função para calcular valor da jornada do motoboy (ATUALIZADA COM HORAS)
  const calcularValorJornada = (jornada) => {
    if (!jornada) return 0;
    
    const loja = lojas.find(l => l.id === jornada.lojaId);
    
    if (!loja) return 0;

    // Valor da diária definido na própria jornada
    const valorDiaria = Number(jornada.valorDiaria) || 0;

    // Cálculo do valor por horas trabalhadas
    const horasTrabalhadas = calcularHorasTrabalhadas(jornada.horasEntrada, jornada.horasSaida);
    const valorHoraSegSab = Number(loja.valorHoraSegSab) || 0;
    const valorHoraDomFeriado = Number(loja.valorHoraDomFeriado) || 0;
    
    const valorPorHora = isDomingoOuFeriado(jornada.data, jornada.eFeriado) 
      ? valorHoraDomFeriado 
      : valorHoraSegSab;
    
    const valorHoras = horasTrabalhadas * valorPorHora;

    // Cálculo das corridas/entregas
    const corridasAte5km = Number(jornada.corridasAte5km) || 0;
    const corridasAcima5km = Number(jornada.corridasAcima5km) || 0;
    const valorCorridaAte5km = Number(loja.valorCorridaAte5km) || 0;
    const valorCorridaAcima5km = Number(loja.valorCorridaAcima5km) || 0;
    
    const valorCorridas = (corridasAte5km * valorCorridaAte5km) + (corridasAcima5km * valorCorridaAcima5km);

    // Comissões e missões (se aplicável)
    const valorComissoes = Number(jornada.comissoes) || 0;
    const valorMissoes = Number(jornada.missoes) || 0;

    const valorTotal = valorDiaria + valorHoras + valorCorridas + valorComissoes + valorMissoes;
    
    return isNaN(valorTotal) ? 0 : valorTotal;
  };

  // Função para calcular custos totais da loja (INCLUINDO DÉBITOS)
  const calcularCustosLoja = (jornadas, loja, incluirDebitos = false) => {
    if (!loja) return {
      valorLogistica: 0,
      comissaoAdministrativa: 0,
      taxaSupervisao: 0,
      debitosPendentes: 0,
      total: 0
    };
    
    // Valor total pago aos motoboys (logística)
    const valorLogistica = jornadas.reduce((sum, j) => sum + calcularValorJornada(j), 0);
    
    // Taxa administrativa da loja (valor fixo configurado)
    const taxaAdministrativa = jornadas.length > 0 ? (loja.taxaAdministrativa || 0) : 0;
    
    // Taxa de supervisão da loja (valor fixo por semana se houver atividade)
    const taxaSupervisao = jornadas.length > 0 ? (loja.taxaSupervisao || 0) : 0;
    
    // Débitos pendentes da loja
    const debitosPendentesLoja = incluirDebitos ? 
      debitosPendentes
        .filter(d => d.lojaId === loja.id && d.status === 'pendente')
        .reduce((sum, d) => sum + (Number(d.valor) || 0), 0) : 0;
    
    const total = valorLogistica + taxaAdministrativa + taxaSupervisao + debitosPendentesLoja;
    
    return {
      valorLogistica,
      comissaoAdministrativa: taxaAdministrativa,
      taxaSupervisao,
      debitosPendentes: debitosPendentesLoja,
      total
    };
  };

  // Função para obter semana formatada
  const getWeekRange = (dateString) => {
    const date = new Date(dateString);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return { weekStart, weekEnd };
  };

  // Componente Modal Genérico
  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  // Modal Motoboy (ATUALIZADO)
  const MotoboyModal = () => {
    const [formData, setFormData] = useState({
      nome: '',
      cpf: '',
      telefone: '',
      status: 'ativo'
    });

    useEffect(() => {
      if (editingItem) {
        setFormData({ ...editingItem });
      } else {
        setFormData({
          nome: '',
          cpf: '',
          telefone: '',
          status: 'ativo'
        });
      }
    }, [editingItem]);

    const handleSubmit = (e) => {
      e.preventDefault();
      const newData = {
        ...formData
      };
      
      if (editingItem) {
        setMotoboys(motoboys.map(m => m.id === editingItem.id ? { ...newData, id: editingItem.id } : m));
      } else {
        setMotoboys([...motoboys, { ...newData, id: Date.now().toString() }]);
      }
      setShowMotoboyModal(false);
      setEditingItem(null);
    };

    const handleClose = () => {
      setShowMotoboyModal(false);
      setEditingItem(null);
    };

    return (
      <Modal isOpen={showMotoboyModal} onClose={handleClose} title="Cadastro de Motoboy">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome Completo</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CPF</label>
            <input
              type="text"
              value={formData.cpf}
              onChange={(e) => setFormData({...formData, cpf: formatCPF(e.target.value)})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength="14"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <input
              type="text"
              value={formData.telefone}
              onChange={(e) => setFormData({...formData, telefone: formatPhone(e.target.value)})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors">
              {editingItem ? 'Atualizar' : 'Cadastrar'}
            </button>
            <button type="button" onClick={handleClose} className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    );
  };

  // Modal Loja (COMPLETAMENTE REFORMULADO)
  const LojaModal = () => {
    const [formData, setFormData] = useState({
      nome: '',
      cnpj: '',
      contato: '',
      valorHoraSegSab: 12,
      valorHoraDomFeriado: 13.33,
      valorCorridaAte5km: 5,
      valorCorridaAcima5km: 8,
      taxaAdministrativa: 350,
      taxaSupervisao: 50
    });

    useEffect(() => {
      if (editingItem) {
        setFormData({ ...editingItem });
      } else {
        setFormData({
          nome: '',
          cnpj: '',
          contato: '',
          valorHoraSegSab: 12,
          valorHoraDomFeriado: 13.33,
          valorCorridaAte5km: 5,
          valorCorridaAcima5km: 8,
          taxaAdministrativa: 350,
          taxaSupervisao: 50
        });
      }
    }, [editingItem]);

    const handleSubmit = (e) => {
      e.preventDefault();
      const newData = {
        ...formData,
        valorHoraSegSab: Number(formData.valorHoraSegSab),
        valorHoraDomFeriado: Number(formData.valorHoraDomFeriado),
        valorCorridaAte5km: Number(formData.valorCorridaAte5km),
        valorCorridaAcima5km: Number(formData.valorCorridaAcima5km),
        taxaAdministrativa: Number(formData.taxaAdministrativa),
        taxaSupervisao: Number(formData.taxaSupervisao)
      };
      
      if (editingItem) {
        setLojas(lojas.map(l => l.id === editingItem.id ? { ...newData, id: editingItem.id } : l));
      } else {
        setLojas([...lojas, { ...newData, id: Date.now().toString() }]);
      }
      setShowLojaModal(false);
      setEditingItem(null);
    };

    const handleClose = () => {
      setShowLojaModal(false);
      setEditingItem(null);
    };

    return (
      <Modal isOpen={showLojaModal} onClose={handleClose} title="Cadastro de Loja">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome da Loja</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CNPJ</label>
            <input
              type="text"
              value={formData.cnpj}
              onChange={(e) => setFormData({...formData, cnpj: formatCNPJ(e.target.value)})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength="18"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contato</label>
            <input
              type="text"
              value={formData.contato}
              onChange={(e) => setFormData({...formData, contato: formatPhone(e.target.value)})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Valor Hora Seg-Sáb (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.valorHoraSegSab}
                onChange={(e) => setFormData({...formData, valorHoraSegSab: e.target.value})}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valor Hora Dom/Feriado (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.valorHoraDomFeriado}
                onChange={(e) => setFormData({...formData, valorHoraDomFeriado: e.target.value})}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Valor Corrida até 5km (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.valorCorridaAte5km}
                onChange={(e) => setFormData({...formData, valorCorridaAte5km: e.target.value})}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valor Corrida acima de 5km (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.valorCorridaAcima5km}
                onChange={(e) => setFormData({...formData, valorCorridaAcima5km: e.target.value})}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Taxa Administrativa (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.taxaAdministrativa}
                onChange={(e) => setFormData({...formData, taxaAdministrativa: e.target.value})}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Taxa Supervisão (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.taxaSupervisao}
                onChange={(e) => setFormData({...formData, taxaSupervisao: e.target.value})}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors">
              {editingItem ? 'Atualizar' : 'Cadastrar'}
            </button>
            <button type="button" onClick={handleClose} className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    );
  };

  // Modal Jornada (ATUALIZADO)
  const JornadaModal = () => {
    const [formData, setFormData] = useState({
      data: '',
      motoboyId: '',
      lojaId: '',
      horasEntrada: '',
      horasSaida: '',
      valorDiaria: 120,
      corridasAte5km: 0,
      corridasAcima5km: 0,
      comissoes: 0,
      missoes: 0,
      eFeriado: false,
      observacoes: ''
    });

    useEffect(() => {
      if (editingItem) {
        setFormData({ ...editingItem });
      } else {
        const initialLojaId = currentUser?.tipo === 'lojista' ? currentUser.lojaId : '';
        setFormData({
          data: '',
          motoboyId: '',
          lojaId: initialLojaId,
          horasEntrada: '',
          horasSaida: '',
          valorDiaria: 120,
          corridasAte5km: 0,
          corridasAcima5km: 0,
          comissoes: 0,
          missoes: 0,
          eFeriado: false,
          observacoes: ''
        });
      }
    }, [editingItem, currentUser]);

    const handleSubmit = (e) => {
      e.preventDefault();
      const newData = {
        ...formData,
        valorDiaria: Number(formData.valorDiaria),
        corridasAte5km: Number(formData.corridasAte5km),
        corridasAcima5km: Number(formData.corridasAcima5km),
        comissoes: Number(formData.comissoes),
        missoes: Number(formData.missoes)
      };
      
      if (editingItem) {
        setJornadas(jornadas.map(j => j.id === editingItem.id ? { ...newData, id: editingItem.id } : j));
      } else {
        setJornadas([...jornadas, { ...newData, id: Date.now().toString() }]);
      }
      setShowJornadaModal(false);
      setEditingItem(null);
    };

    const handleClose = () => {
      setShowJornadaModal(false);
      setEditingItem(null);
    };

    return (
      <Modal isOpen={showJornadaModal} onClose={handleClose} title="Registro de Jornada">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Data</label>
            <input
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({...formData, data: e.target.value})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Motoboy</label>
            <select
              value={formData.motoboyId}
              onChange={(e) => setFormData({...formData, motoboyId: e.target.value})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione um motoboy</option>
              {motoboys.filter(m => m.status === 'ativo').map(motoboy => (
                <option key={motoboy.id} value={motoboy.id}>{motoboy.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Loja</label>
            <select
              value={formData.lojaId}
              onChange={(e) => setFormData({...formData, lojaId: e.target.value})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={currentUser?.tipo === 'lojista'}
            >
              <option value="">Selecione uma loja</option>
              {lojas
                .filter(loja => canAccessLoja(loja.id))
                .map(loja => (
                  <option key={loja.id} value={loja.id}>{loja.nome}</option>
                ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Hora Entrada</label>
              <input
                type="time"
                value={formData.horasEntrada}
                onChange={(e) => setFormData({...formData, horasEntrada: e.target.value})}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hora Saída</label>
              <input
                type="time"
                value={formData.horasSaida}
                onChange={(e) => setFormData({...formData, horasSaida: e.target.value})}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valor da Diária (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.valorDiaria}
              onChange={(e) => setFormData({...formData, valorDiaria: e.target.value})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Corridas até 5km</label>
              <input
                type="number"
                value={formData.corridasAte5km}
                onChange={(e) => setFormData({...formData, corridasAte5km: e.target.value})}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Corridas acima de 5km</label>
              <input
                type="number"
                value={formData.corridasAcima5km}
                onChange={(e) => setFormData({...formData, corridasAcima5km: e.target.value})}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Comissões (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.comissoes}
                onChange={(e) => setFormData({...formData, comissoes: e.target.value})}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Missões (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.missoes}
                onChange={(e) => setFormData({...formData, missoes: e.target.value})}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.eFeriado}
                onChange={(e) => setFormData({...formData, eFeriado: e.target.checked})}
                className="mr-2"
              />
              É feriado?
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              className="w-full border rounded px-3 py-2 h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors">
              {editingItem ? 'Atualizar' : 'Registrar'}
            </button>
            <button type="button" onClick={handleClose} className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    );
  };

  // Modal Colaborador
  const ColaboradorModal = () => {
    const [formData, setFormData] = useState({
      nome: '',
      email: '',
      senha: '',
      tipo: 'lojista',
      lojaId: '',
      ativo: true
    });

    useEffect(() => {
      if (editingItem) {
        setFormData({ ...editingItem });
      } else {
        setFormData({
          nome: '',
          email: '',
          senha: '',
          tipo: 'lojista',
          lojaId: '',
          ativo: true
        });
      }
    }, [editingItem]);

    const handleSubmit = (e) => {
      e.preventDefault();
      
      // Verificar se email já existe
      const emailExists = colaboradores.some(c => 
        c.email === formData.email && 
        (!editingItem || c.id !== editingItem.id)
      );
      
      if (emailExists) {
        alert('Este email já está cadastrado!');
        return;
      }

      const newData = {
        ...formData,
        lojaId: formData.tipo === 'lojista' ? formData.lojaId : null
      };
      
      if (editingItem) {
        setColaboradores(colaboradores.map(c => 
          c.id === editingItem.id ? { ...newData, id: editingItem.id } : c
        ));
      } else {
        setColaboradores([...colaboradores, { 
          ...newData, 
          id: Date.now().toString(),
          dataCriacao: new Date().toISOString().split('T')[0]
        }]);
      }
      setShowColaboradorModal(false);
      setEditingItem(null);
    };

    const handleClose = () => {
      setShowColaboradorModal(false);
      setEditingItem(null);
    };

    return (
      <Modal isOpen={showColaboradorModal} onClose={handleClose} title="Cadastro de Colaborador">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome Completo</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <input
              type="password"
              value={formData.senha}
              onChange={(e) => setFormData({...formData, senha: e.target.value})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength="6"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Usuário</label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({...formData, tipo: e.target.value, lojaId: ''})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="lojista">Lojista</option>
              <option value="financeiro">Financeiro</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          {formData.tipo === 'lojista' && (
            <div>
              <label className="block text-sm font-medium mb-1">Loja</label>
              <select
                value={formData.lojaId}
                onChange={(e) => setFormData({...formData, lojaId: e.target.value})}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione uma loja</option>
                {lojas.map(loja => (
                  <option key={loja.id} value={loja.id}>{loja.nome}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.ativo}
                onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                className="mr-2"
              />
              Usuário Ativo
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors">
              {editingItem ? 'Atualizar' : 'Cadastrar'}
            </button>
            <button type="button" onClick={handleClose} className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    );
  };

  // Tela de Login
  const LoginScreen = () => {
    const [loginData, setLoginData] = useState({ email: '', senha: '' });
    const [error, setError] = useState('');

    const handleLogin = (e) => {
      e.preventDefault();
      setError('');
      
      if (login(loginData.email, loginData.senha)) {
        setLoginData({ email: '', senha: '' });
      } else {
        setError('Email ou senha incorretos, ou usuário inativo.');
      }
    };

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center mb-8">
            <img 
              src="assets/JeFG5upo7Hg6wrzGnryGF.jpeg" 
              alt="Expresso Neves" 
              className="h-16 w-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900">Expresso Neves</h1>
            <p className="text-gray-600">Sistema de Gestão de Motoboys</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Senha</label>
              <input
                type="password"
                value={loginData.senha}
                onChange={(e) => setLoginData({...loginData, senha: e.target.value})}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="********"
                required
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
            <button 
              type="submit" 
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Entrar
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Usuário de teste:</p>
            <p>Email: <strong>admin@expressoneves.com</strong></p>
            <p>Senha: <strong>admin123</strong></p>
          </div>
        </div>
      </div>
    );
  };

  // Modal Débito Pendente
  const DebitoModal = () => {
    const [formData, setFormData] = useState({
      lojaId: '',
      descricao: '',
      valor: 0,
      dataVencimento: '',
      status: 'pendente'
    });

    useEffect(() => {
      if (editingItem) {
        setFormData({ ...editingItem });
      } else {
        const initialLojaId = currentUser?.tipo === 'lojista' ? currentUser.lojaId : '';
        setFormData({
          lojaId: initialLojaId,
          descricao: '',
          valor: 0,
          dataVencimento: '',
          status: 'pendente'
        });
      }
    }, [editingItem, currentUser]);

    const handleSubmit = (e) => {
      e.preventDefault();
      const newData = {
        ...formData,
        valor: Number(formData.valor),
        dataCriacao: editingItem?.dataCriacao || new Date().toISOString().split('T')[0]
      };
      
      if (editingItem) {
        setDebitosPendentes(debitosPendentes.map(d => d.id === editingItem.id ? { ...newData, id: editingItem.id } : d));
      } else {
        setDebitosPendentes([...debitosPendentes, { ...newData, id: Date.now().toString() }]);
      }
      setShowDebitoModal(false);
      setEditingItem(null);
    };

    const handleClose = () => {
      setShowDebitoModal(false);
      setEditingItem(null);
    };

    return (
      <Modal isOpen={showDebitoModal} onClose={handleClose} title="Registro de Débito Pendente">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Loja</label>
            <select
              value={formData.lojaId}
              onChange={(e) => setFormData({...formData, lojaId: e.target.value})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={currentUser?.tipo === 'lojista'}
            >
              <option value="">Selecione uma loja</option>
              {lojas
                .filter(loja => canAccessLoja(loja.id))
                .map(loja => (
                  <option key={loja.id} value={loja.id}>{loja.nome}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              className="w-full border rounded px-3 py-2 h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Descreva o débito pendente..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => setFormData({...formData, valor: e.target.value})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data de Vencimento</label>
            <input
              type="date"
              value={formData.dataVencimento}
              onChange={(e) => setFormData({...formData, dataVencimento: e.target.value})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors">
              {editingItem ? 'Atualizar' : 'Registrar'}
            </button>
            <button type="button" onClick={handleClose} className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    );
  };

  // Modal Adiantamento
  const AdiantamentoModal = () => {
    const [formData, setFormData] = useState({
      motoboyId: '',
      lojaId: '',
      valor: 0,
      data: '',
      observacao: ''
    });

    useEffect(() => {
      if (editingItem) {
        setFormData({ ...editingItem });
      } else {
        const initialLojaId = currentUser?.tipo === 'lojista' ? currentUser.lojaId : '';
        setFormData({
          motoboyId: '',
          lojaId: initialLojaId,
          valor: 0,
          data: '',
          observacao: ''
        });
      }
    }, [editingItem, currentUser]);

    const handleSubmit = (e) => {
      e.preventDefault();
      const newData = {
        ...formData,
        valor: Number(formData.valor)
      };
      
      if (editingItem) {
        setAdiantamentos(adiantamentos.map(a => a.id === editingItem.id ? { ...newData, id: editingItem.id } : a));
      } else {
        setAdiantamentos([...adiantamentos, { ...newData, id: Date.now().toString() }]);
      }
      setShowAdiantamentoModal(false);
      setEditingItem(null);
    };

    const handleClose = () => {
      setShowAdiantamentoModal(false);
      setEditingItem(null);
    };

    return (
      <Modal isOpen={showAdiantamentoModal} onClose={handleClose} title="Registro de Adiantamento">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Motoboy</label>
            <select
              value={formData.motoboyId}
              onChange={(e) => setFormData({...formData, motoboyId: e.target.value})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione um motoboy</option>
              {motoboys.filter(m => m.status === 'ativo').map(motoboy => (
                <option key={motoboy.id} value={motoboy.id}>{motoboy.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Loja</label>
            <select
              value={formData.lojaId}
              onChange={(e) => setFormData({...formData, lojaId: e.target.value})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={currentUser?.tipo === 'lojista'}
            >
              <option value="">Selecione uma loja</option>
              {lojas
                .filter(loja => canAccessLoja(loja.id))
                .map(loja => (
                  <option key={loja.id} value={loja.id}>{loja.nome}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => setFormData({...formData, valor: e.target.value})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data</label>
            <input
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({...formData, data: e.target.value})}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Observação</label>
            <textarea
              value={formData.observacao}
              onChange={(e) => setFormData({...formData, observacao: e.target.value})}
              className="w-full border rounded px-3 py-2 h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors">
              {editingItem ? 'Atualizar' : 'Registrar'}
            </button>
            <button type="button" onClick={handleClose} className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    );
  };

  // Dashboard
  const Dashboard = () => {
    const { weekStart, weekEnd } = getWeekRange(selectedWeek);

    const jornadasSemana = jornadas.filter(j => {
      const dataJornada = new Date(j.data);
      return dataJornada >= weekStart && dataJornada <= weekEnd;
    });

    const totalFaturamento = jornadasSemana.reduce((sum, j) => sum + calcularValorJornada(j), 0);
    const totalCorridas = jornadasSemana.reduce((sum, j) => sum + (j.corridasAte5km || 0) + (j.corridasAcima5km || 0), 0);
    const motoboyAtivos = motoboys.filter(m => m.status === 'ativo').length;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <label className="text-sm font-medium">Semana:</label>
            <input
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">Faturamento Semanal</h3>
            <p className="text-2xl font-bold text-blue-600">R$ {totalFaturamento.toFixed(2)}</p>
          </div>
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800">Total de Corridas</h3>
            <p className="text-2xl font-bold text-green-600">{totalCorridas}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800">Jornadas Semana</h3>
            <p className="text-2xl font-bold text-yellow-600">{jornadasSemana.length}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800">Motoboys Ativos</h3>
            <p className="text-2xl font-bold text-purple-600">{motoboyAtivos}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Jornadas da Semana</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {jornadasSemana.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma jornada registrada nesta semana</p>
              ) : (
                jornadasSemana.map(jornada => {
                  const motoboy = motoboys.find(m => m.id === jornada.motoboyId);
                  const loja = lojas.find(l => l.id === jornada.lojaId);
                  return (
                    <div key={jornada.id} className="border-l-4 border-blue-500 pl-3 py-2 bg-gray-50 rounded">
                      <div className="font-medium">{motoboy?.nome || 'Motoboy não encontrado'}</div>
                      <div className="text-sm text-gray-600">{loja?.nome || 'Loja não encontrada'} - {formatDateBR(jornada.data)}</div>
                      <div className="text-sm">R$ {calcularValorJornada(jornada).toFixed(2)}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Resumo por Loja</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lojas.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma loja cadastrada</p>
              ) : (
                lojas.map(loja => {
                  const jornadasLoja = jornadasSemana.filter(j => j.lojaId === loja.id);
                  const custos = calcularCustosLoja(jornadasLoja, loja);
                  return (
                    <div key={loja.id} className="border-l-4 border-green-500 pl-3 py-2 bg-gray-50 rounded">
                      <div className="font-medium">{loja.nome}</div>
                      <div className="text-sm text-gray-600">Jornadas: {jornadasLoja.length}</div>
                      <div className="text-sm text-gray-600">Logística: R$ {custos.valorLogistica.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">Total Custo: R$ {custos.total.toFixed(2)}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Lista de Motoboys
  const MotoboysTab = () => {
    const deleteMotoboy = (id) => {
      if (window.confirm('Tem certeza que deseja excluir este motoboy?')) {
        setMotoboys(motoboys.filter(m => m.id !== id));
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Motoboys</h2>
          {hasPermission('manageMotoboys') && (
            <button
              onClick={() => setShowMotoboyModal(true)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              <PlusCircle size={20} />
              Novo Motoboy
            </button>
          )}
        </div>

        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">CPF</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Telefone</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {motoboys.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      Nenhum motoboy cadastrado
                    </td>
                  </tr>
                ) : (
                  motoboys.map(motoboy => (
                    <tr key={motoboy.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{motoboy.nome}</td>
                      <td className="px-4 py-3">{motoboy.cpf}</td>
                      <td className="px-4 py-3">{motoboy.telefone}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          motoboy.status === 'ativo' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {motoboy.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(motoboy);
                              setShowMotoboyModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deleteMotoboy(motoboy.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Lista de Lojas (ATUALIZADA)
  const LojasTab = () => {
    const deleteLoja = (id) => {
      if (window.confirm('Tem certeza que deseja excluir esta loja?')) {
        setLojas(lojas.filter(l => l.id !== id));
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Lojas</h2>
          {hasPermission('manageLojas') && (
            <button
              onClick={() => setShowLojaModal(true)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              <PlusCircle size={20} />
              Nova Loja
            </button>
          )}
        </div>

        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">CNPJ</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Contato</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Valor/Hora</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Taxa Admin</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Débitos</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lojas.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      Nenhuma loja cadastrada
                    </td>
                  </tr>
                ) : (
                  lojas.map(loja => {
                    const debitosLoja = debitosPendentes
                      .filter(d => d.lojaId === loja.id && d.status === 'pendente')
                      .reduce((sum, d) => sum + (Number(d.valor) || 0), 0);

                    return (
                    <tr key={loja.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{loja.nome}</td>
                      <td className="px-4 py-3">{loja.cnpj}</td>
                      <td className="px-4 py-3">{loja.contato}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div>Seg-Sáb: R$ {Number(loja.valorHoraSegSab || 0).toFixed(2)}</div>
                          <div>Dom/Fer: R$ {Number(loja.valorHoraDomFeriado || 0).toFixed(2)}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">R$ {Number(loja.taxaAdministrativa || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${debitosLoja > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          R$ {debitosLoja.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(loja);
                              setShowLojaModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deleteLoja(loja.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Lista de Jornadas (ATUALIZADA COM DETALHAMENTO)
  const JornadasTab = () => {
    const deleteJornada = (id) => {
      if (window.confirm('Tem certeza que deseja excluir esta jornada?')) {
        setJornadas(jornadas.filter(j => j.id !== id));
      }
    };

    // Função para calcular detalhes da jornada
    const calcularDetalhesJornada = (jornada) => {
      if (!jornada) return { horasTrabalhadas: 0, valorDiaria: 0, valorHoras: 0, valorCorridas: 0, valorComissoes: 0, valorMissoes: 0, valorTotal: 0 };
      
      const loja = lojas.find(l => l.id === jornada.lojaId);
      
      if (!loja) return { horasTrabalhadas: 0, valorDiaria: 0, valorHoras: 0, valorCorridas: 0, valorComissoes: 0, valorMissoes: 0, valorTotal: 0 };

      // Horas trabalhadas
      const horasTrabalhadas = calcularHorasTrabalhadas(jornada.horasEntrada, jornada.horasSaida);

      // Valor da diária definido na própria jornada
      const valorDiaria = Number(jornada.valorDiaria) || 0;

      // Valor por horas trabalhadas
      const valorHoraSegSab = Number(loja.valorHoraSegSab) || 0;
      const valorHoraDomFeriado = Number(loja.valorHoraDomFeriado) || 0;
      const valorPorHora = isDomingoOuFeriado(jornada.data, jornada.eFeriado) 
        ? valorHoraDomFeriado 
        : valorHoraSegSab;
      const valorHoras = horasTrabalhadas * valorPorHora;

      // Valor das corridas
      const corridasAte5km = Number(jornada.corridasAte5km) || 0;
      const corridasAcima5km = Number(jornada.corridasAcima5km) || 0;
      const valorCorridaAte5km = Number(loja.valorCorridaAte5km) || 0;
      const valorCorridaAcima5km = Number(loja.valorCorridaAcima5km) || 0;
      const valorCorridas = (corridasAte5km * valorCorridaAte5km) + (corridasAcima5km * valorCorridaAcima5km);

      // Extras
      const valorComissoes = Number(jornada.comissoes) || 0;
      const valorMissoes = Number(jornada.missoes) || 0;

      const valorTotal = valorDiaria + valorHoras + valorCorridas + valorComissoes + valorMissoes;

      return {
        horasTrabalhadas,
        valorDiaria,
        valorHoras,
        valorCorridas,
        valorComissoes,
        valorMissoes,
        valorTotal: isNaN(valorTotal) ? 0 : valorTotal
      };
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Jornadas</h2>
          <button
            onClick={() => setShowJornadaModal(true)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            <PlusCircle size={20} />
            Nova Jornada
          </button>
        </div>

        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Motoboy</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Loja</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Horário</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Horas</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Valor Diária</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Valor Horas</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Corridas ≤5km</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Corridas >5km</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Valor Corridas</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Extras</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jornadas.length === 0 ? (
                  <tr>
                    <td colSpan="13" className="px-4 py-8 text-center text-gray-500">
                      Nenhuma jornada registrada
                    </td>
                  </tr>
                ) : (
                  jornadas
                    .filter(jornada => canAccessLoja(jornada.lojaId))
                    .map(jornada => {
                    const motoboy = motoboys.find(m => m.id === jornada.motoboyId);
                    const loja = lojas.find(l => l.id === jornada.lojaId);
                    const detalhes = calcularDetalhesJornada(jornada);
                    const totalExtras = detalhes.valorComissoes + detalhes.valorMissoes;
                    
                    return (
                      <tr key={jornada.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            {formatDateBR(jornada.data)}
                            {jornada.eFeriado && (
                              <span className="block text-xs text-red-600 font-medium">FERIADO</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">{motoboy?.nome || 'N/A'}</td>
                        <td className="px-4 py-3">{loja?.nome || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            {jornada.horasEntrada} - {jornada.horasSaida}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{detalhes.horasTrabalhadas.toFixed(1)}h</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-blue-600 font-medium">R$ {(Number(jornada.valorDiaria) || 0).toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-indigo-600 font-medium">R$ {detalhes.valorHoras.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">{jornada.corridasAte5km || 0}</td>
                        <td className="px-4 py-3 text-center">{jornada.corridasAcima5km || 0}</td>
                        <td className="px-4 py-3">
                          <span className="text-green-600 font-medium">R$ {detalhes.valorCorridas.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3">
                          {totalExtras > 0 ? (
                            <div className="text-sm">
                              <span className="text-purple-600 font-medium">R$ {totalExtras.toFixed(2)}</span>
                              {(detalhes.valorComissoes > 0 || detalhes.valorMissoes > 0) && (
                                <div className="text-xs text-gray-500">
                                  {detalhes.valorComissoes > 0 && `Com: ${detalhes.valorComissoes.toFixed(2)}`}
                                  {detalhes.valorComissoes > 0 && detalhes.valorMissoes > 0 && ' | '}
                                  {detalhes.valorMissoes > 0 && `Mis: ${detalhes.valorMissoes.toFixed(2)}`}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">R$ 0,00</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-gray-800">R$ {detalhes.valorTotal.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingItem(jornada);
                                setShowJornadaModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deleteJornada(jornada.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Lista de Colaboradores
  const ColaboradoresTab = () => {
    const deleteColaborador = (id) => {
      if (window.confirm('Tem certeza que deseja excluir este colaborador?')) {
        setColaboradores(colaboradores.filter(c => c.id !== id));
      }
    };

    const getTipoLabel = (tipo) => {
      const labels = {
        admin: 'Administrador',
        financeiro: 'Financeiro',
        lojista: 'Lojista'
      };
      return labels[tipo] || tipo;
    };

    const getTipoBadgeColor = (tipo) => {
      const colors = {
        admin: 'bg-red-100 text-red-800',
        financeiro: 'bg-blue-100 text-blue-800',
        lojista: 'bg-green-100 text-green-800'
      };
      return colors[tipo] || 'bg-gray-100 text-gray-800';
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Colaboradores</h2>
          <button
            onClick={() => setShowColaboradorModal(true)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            <PlusCircle size={20} />
            Novo Colaborador
          </button>
        </div>

        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Loja</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Data Criação</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {colaboradores.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      Nenhum colaborador cadastrado
                    </td>
                  </tr>
                ) : (
                  colaboradores.map(colaborador => {
                    const loja = lojas.find(l => l.id === colaborador.lojaId);
                    return (
                      <tr key={colaborador.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{colaborador.nome}</td>
                        <td className="px-4 py-3">{colaborador.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoBadgeColor(colaborador.tipo)}`}>
                            {getTipoLabel(colaborador.tipo)}
                          </span>
                        </td>
                        <td className="px-4 py-3">{loja?.nome || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            colaborador.ativo 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {colaborador.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">{formatDateBR(colaborador.dataCriacao)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingItem(colaborador);
                                setShowColaboradorModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            {colaborador.id !== currentUser?.id && (
                              <button
                                onClick={() => deleteColaborador(colaborador.id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Lista de Débitos Pendentes
  const DebitosPendentesTab = () => {
    const deleteDebito = (id) => {
      if (window.confirm('Tem certeza que deseja excluir este débito?')) {
        setDebitosPendentes(debitosPendentes.filter(d => d.id !== id));
      }
    };

    const getStatusBadgeColor = (status) => {
      const colors = {
        pendente: 'bg-yellow-100 text-yellow-800',
        pago: 'bg-green-100 text-green-800',
        cancelado: 'bg-red-100 text-red-800'
      };
      return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status) => {
      const labels = {
        pendente: 'Pendente',
        pago: 'Pago',
        cancelado: 'Cancelado'
      };
      return labels[status] || status;
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Débitos Pendentes</h2>
          <button
            onClick={() => setShowDebitoModal(true)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            <PlusCircle size={20} />
            Novo Débito
          </button>
        </div>

        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Loja</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Descrição</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Valor</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vencimento</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {debitosPendentes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      Nenhum débito registrado
                    </td>
                  </tr>
                ) : (
                  debitosPendentes
                    .filter(debito => canAccessLoja(debito.lojaId))
                    .map(debito => {
                    const loja = lojas.find(l => l.id === debito.lojaId);
                    const isVencido = new Date(debito.dataVencimento) < new Date() && debito.status === 'pendente';
                    
                    return (
                      <tr key={debito.id} className={`hover:bg-gray-50 ${isVencido ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3">{loja?.nome || 'N/A'}</td>
                        <td className="px-4 py-3">{debito.descricao}</td>
                        <td className="px-4 py-3">R$ {Number(debito.valor || 0).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <div className={isVencido ? 'text-red-600 font-medium' : ''}>
                            {formatDateBR(debito.dataVencimento)}
                            {isVencido && <div className="text-xs">VENCIDO</div>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(debito.status)}`}>
                            {getStatusLabel(debito.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingItem(debito);
                                setShowDebitoModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deleteDebito(debito.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumo de Débitos */}
        {debitosPendentes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800">Débitos Pendentes</h3>
              <p className="text-xl font-bold text-yellow-600">
                R$ {debitosPendentes
                  .filter(d => d.status === 'pendente' && canAccessLoja(d.lojaId))
                  .reduce((sum, d) => sum + (Number(d.valor) || 0), 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-red-800">Débitos Vencidos</h3>
              <p className="text-xl font-bold text-red-600">
                R$ {debitosPendentes
                  .filter(d => d.status === 'pendente' && new Date(d.dataVencimento) < new Date() && canAccessLoja(d.lojaId))
                  .reduce((sum, d) => sum + (Number(d.valor) || 0), 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">Débitos Pagos</h3>
              <p className="text-xl font-bold text-green-600">
                R$ {debitosPendentes
                  .filter(d => d.status === 'pago' && canAccessLoja(d.lojaId))
                  .reduce((sum, d) => sum + (Number(d.valor) || 0), 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Lista de Adiantamentos
  const AdiantamentosTab = () => {
    const deleteAdiantamento = (id) => {
      if (window.confirm('Tem certeza que deseja excluir este adiantamento?')) {
        setAdiantamentos(adiantamentos.filter(a => a.id !== id));
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Adiantamentos</h2>
          <button
            onClick={() => setShowAdiantamentoModal(true)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            <PlusCircle size={20} />
            Novo Adiantamento
          </button>
        </div>

        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Motoboy</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Loja</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Valor</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Observação</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {adiantamentos.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      Nenhum adiantamento registrado
                    </td>
                  </tr>
                ) : (
                  adiantamentos
                    .filter(adiantamento => canAccessLoja(adiantamento.lojaId))
                    .map(adiantamento => {
                    const motoboy = motoboys.find(m => m.id === adiantamento.motoboyId);
                    const loja = lojas.find(l => l.id === adiantamento.lojaId);
                    return (
                      <tr key={adiantamento.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{formatDateBR(adiantamento.data)}</td>
                        <td className="px-4 py-3">{motoboy?.nome || 'N/A'}</td>
                        <td className="px-4 py-3">{loja?.nome || 'N/A'}</td>
                        <td className="px-4 py-3">R$ {Number(adiantamento.valor || 0).toFixed(2)}</td>
                        <td className="px-4 py-3">{adiantamento.observacao}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingItem(adiantamento);
                                setShowAdiantamentoModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deleteAdiantamento(adiantamento.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Relatórios (COMPLETAMENTE ATUALIZADO)
  const RelatoriosTab = () => {
    const [filtroLoja, setFiltroLoja] = useState(
      currentUser?.tipo === 'lojista' ? currentUser.lojaId : ''
    );
    const { weekStart, weekEnd } = getWeekRange(selectedWeek);

    const jornadasSemana = jornadas.filter(j => {
      if (!j.data) return false;
      const dataJornada = new Date(j.data);
      const dentroSemana = dataJornada >= weekStart && dataJornada <= weekEnd;
      const filtroLojaMatch = !filtroLoja || j.lojaId === filtroLoja;
      return dentroSemana && filtroLojaMatch;
    });

    const adiantamentosSemana = adiantamentos.filter(a => {
      if (!a.data) return false;
      const dataAdiantamento = new Date(a.data);
      const dentroSemana = dataAdiantamento >= weekStart && dataAdiantamento <= weekEnd;
      const filtroLojaMatch = !filtroLoja || a.lojaId === filtroLoja;
      return dentroSemana && filtroLojaMatch;
    });

    // Função para exportar relatório de motoboys em CSV
    const exportarRelatorioMotoboyCSV = () => {
      const dados = relatorioMotoboys.filter(r => r.temAtividade);
      if (dados.length === 0) {
        alert('Nenhum dado para exportar no período selecionado.');
        return;
      }

      let csvContent = '';
      
      if (filtroLoja) {
        // Se há filtro de loja, exportar normalmente
        const loja = lojas.find(l => l.id === filtroLoja);
        csvContent += `EXPRESSO NEVES - RELATÓRIO DE MOTOBOYS\n`;
        csvContent += `LOJA: ${loja?.nome || 'N/A'}\n`;
        csvContent += `Período: ${weekStart.toLocaleDateString('pt-BR')} a ${weekEnd.toLocaleDateString('pt-BR')}\n\n`;
        
        csvContent += ['Motoboy', 'Total Horas', 'Total Corridas', 'Corridas ≤5km', 'Corridas >5km', 'Valor Bruto', 'Adiantamentos', 'Valor Líquido'].join(',') + '\n';
        
        dados.forEach(r => {
          csvContent += [
            r.motoboy.nome,
            r.totalHoras.toFixed(1),
            r.totalCorridas,
            r.totalCorridasAte5km,
            r.totalCorridasAcima5km,
            `R$ ${r.valorBruto.toFixed(2)}`,
            `R$ ${r.totalAdiantamentos.toFixed(2)}`,
            `R$ ${r.valorLiquido.toFixed(2)}`
          ].join(',') + '\n';
        });
      } else {
        // Se não há filtro, separar por loja
        csvContent += `EXPRESSO NEVES - RELATÓRIO DE MOTOBOYS POR LOJA\n`;
        csvContent += `Período: ${weekStart.toLocaleDateString('pt-BR')} a ${weekEnd.toLocaleDateString('pt-BR')}\n\n`;
        
        lojas.forEach(loja => {
          const motoboysDaLoja = dados.filter(r => {
            const jornadasDoMotoboy = jornadasSemana.filter(j => j.motoboyId === r.motoboy.id && j.lojaId === loja.id);
            return jornadasDoMotoboy.length > 0;
          });
          
          if (motoboysDaLoja.length > 0) {
            csvContent += `\nLOJA: ${loja.nome}\n`;
            csvContent += ['Motoboy', 'Total Horas', 'Total Corridas', 'Corridas ≤5km', 'Corridas >5km', 'Valor Bruto', 'Adiantamentos', 'Valor Líquido'].join(',') + '\n';
            
            motoboysDaLoja.forEach(r => {
              csvContent += [
                r.motoboy.nome,
                r.totalHoras.toFixed(1),
                r.totalCorridas,
                r.totalCorridasAte5km,
                r.totalCorridasAcima5km,
                `R$ ${r.valorBruto.toFixed(2)}`,
                `R$ ${r.totalAdiantamentos.toFixed(2)}`,
                `R$ ${r.valorLiquido.toFixed(2)}`
              ].join(',') + '\n';
            });
            csvContent += `${'='.repeat(80)}\n`;
          }
        });
      }

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_motoboys_${weekStart.toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    // Função para exportar relatório de motoboys em PDF
    const exportarRelatorioMotoboyPDF = () => {
      const dados = relatorioMotoboys.filter(r => r.temAtividade);
      if (dados.length === 0) {
        alert('Nenhum dado para exportar no período selecionado.');
        return;
      }

      const doc = new jsPDF();
      let currentY = 20;
      
      if (filtroLoja) {
        // Se há filtro de loja, exportar normalmente
        const loja = lojas.find(l => l.id === filtroLoja);
        doc.setFontSize(16);
        doc.text('EXPRESSO NEVES - RELATÓRIO DE MOTOBOYS', 20, currentY);
        currentY += 10;
        doc.setFontSize(12);
        doc.text(`Período: ${weekStart.toLocaleDateString('pt-BR')} a ${weekEnd.toLocaleDateString('pt-BR')}`, 20, currentY);
        currentY += 7;
        doc.text(`Loja: ${loja?.nome || 'N/A'}`, 20, currentY);
        currentY += 15;

        const tableData = dados.map(r => [
          r.motoboy.nome,
          `${r.totalHoras.toFixed(1)}h`,
          r.totalCorridas.toString(),
          `${r.totalCorridasAte5km} | ${r.totalCorridasAcima5km}`,
          `R$ ${r.valorBruto.toFixed(2)}`,
          `R$ ${r.totalAdiantamentos.toFixed(2)}`,
          `R$ ${r.valorLiquido.toFixed(2)}`
        ]);

        autoTable(doc, {
          head: [['Motoboy', 'Horas', 'Corridas', '≤5km | >5km', 'Valor Bruto', 'Adiantamentos', 'Valor Líquido']],
          body: tableData,
          startY: currentY,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [66, 139, 202] }
        });
      } else {
        // Se não há filtro, separar por loja
        doc.setFontSize(16);
        doc.text('EXPRESSO NEVES - RELATÓRIO DE MOTOBOYS POR LOJA', 20, currentY);
        currentY += 10;
        doc.setFontSize(12);
        doc.text(`Período: ${weekStart.toLocaleDateString('pt-BR')} a ${weekEnd.toLocaleDateString('pt-BR')}`, 20, currentY);
        currentY += 15;
        
        lojas.forEach((loja, index) => {
          const motoboysDaLoja = dados.filter(r => {
            const jornadasDoMotoboy = jornadasSemana.filter(j => j.motoboyId === r.motoboy.id && j.lojaId === loja.id);
            return jornadasDoMotoboy.length > 0;
          });
          
          if (motoboysDaLoja.length > 0) {
            if (index > 0) {
              doc.addPage();
              currentY = 20;
            }
            
            doc.setFontSize(14);
            doc.text(`LOJA: ${loja.nome}`, 20, currentY);
            currentY += 15;
            
            const tableData = motoboysDaLoja.map(r => [
              r.motoboy.nome,
              `${r.totalHoras.toFixed(1)}h`,
              r.totalCorridas.toString(),
              `${r.totalCorridasAte5km} | ${r.totalCorridasAcima5km}`,
              `R$ ${r.valorBruto.toFixed(2)}`,
              `R$ ${r.totalAdiantamentos.toFixed(2)}`,
              `R$ ${r.valorLiquido.toFixed(2)}`
            ]);

            autoTable(doc, {
              head: [['Motoboy', 'Horas', 'Corridas', '≤5km | >5km', 'Valor Bruto', 'Adiantamentos', 'Valor Líquido']],
              body: tableData,
              startY: currentY,
              styles: { fontSize: 9 },
              headStyles: { fillColor: [66, 139, 202] }
            });
          }
        });
      }

      doc.save(`relatorio_motoboys_${weekStart.toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
    };

    // Função para exportar relatório detalhado de lojas em CSV
    const exportarRelatorioLojasCSV = () => {
      const dados = relatorioLojas.filter(r => r.temAtividade);
      if (dados.length === 0) {
        alert('Nenhum dado para exportar no período selecionado.');
        return;
      }

      let csvContent = '';
      
      dados.forEach(relatorio => {
        csvContent += `\nEXPRESSO NEVES - RELATÓRIO DA LOJA: ${relatorio.loja.nome}\n`;
        csvContent += `Período: ${weekStart.toLocaleDateString('pt-BR')} a ${weekEnd.toLocaleDateString('pt-BR')}\n`;
        csvContent += `CNPJ: ${relatorio.loja.cnpj}\n`;
        csvContent += `Contato: ${relatorio.loja.contato}\n\n`;
        
        csvContent += `RESUMO FINANCEIRO:\n`;
        csvContent += `Valor Logística,R$ ${relatorio.valorLogistica.toFixed(2)}\n`;
        csvContent += `Taxa Administrativa,R$ ${relatorio.comissaoAdministrativa.toFixed(2)}\n`;
        csvContent += `Taxa Supervisão,R$ ${relatorio.taxaSupervisao.toFixed(2)}\n`;
        csvContent += `TOTAL,R$ ${relatorio.valorTotal.toFixed(2)}\n\n`;
        
        csvContent += `DETALHAMENTO POR MOTOBOY:\n`;
        csvContent += `Motoboy,Total Horas,Jornadas,Corridas ≤5km,Corridas >5km,Valor Corridas,Extras,Total Pago\n`;
        
        // Consolidar dados por motoboy para o CSV
        const motoboyConsolidadoCSV = {};
        
        relatorio.jornadasLoja.forEach(jornada => {
          const motoboy = motoboys.find(m => m.id === jornada.motoboyId);
          const motoboyNome = motoboy?.nome || 'N/A';
          const detalhes = calcularDetalhesJornada(jornada);
          const totalExtras = detalhes.valorComissoes + detalhes.valorMissoes;
          
          if (!motoboyConsolidadoCSV[jornada.motoboyId]) {
            motoboyConsolidadoCSV[jornada.motoboyId] = {
              nome: motoboyNome,
              totalHoras: 0,
              totalJornadas: 0,
              totalCorridasAte5km: 0,
              totalCorridasAcima5km: 0,
              totalValorCorridas: 0,
              totalExtras: 0,
              totalPago: 0
            };
          }
          
          motoboyConsolidadoCSV[jornada.motoboyId].totalHoras += detalhes.horasTrabalhadas;
          motoboyConsolidadoCSV[jornada.motoboyId].totalJornadas += 1;
          motoboyConsolidadoCSV[jornada.motoboyId].totalCorridasAte5km += (jornada.corridasAte5km || 0);
          motoboyConsolidadoCSV[jornada.motoboyId].totalCorridasAcima5km += (jornada.corridasAcima5km || 0);
          motoboyConsolidadoCSV[jornada.motoboyId].totalValorCorridas += detalhes.valorCorridas;
          motoboyConsolidadoCSV[jornada.motoboyId].totalExtras += totalExtras;
          motoboyConsolidadoCSV[jornada.motoboyId].totalPago += detalhes.valorTotal;
        });
        
        Object.values(motoboyConsolidadoCSV).forEach(motoboy => {
          csvContent += `${motoboy.nome},${motoboy.totalHoras.toFixed(1)}h,${motoboy.totalJornadas},${motoboy.totalCorridasAte5km},${motoboy.totalCorridasAcima5km},R$ ${motoboy.totalValorCorridas.toFixed(2)},R$ ${motoboy.totalExtras.toFixed(2)},R$ ${motoboy.totalPago.toFixed(2)}\n`;
        });
        
        csvContent += `\n${'='.repeat(80)}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_detalhado_lojas_${weekStart.toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    // Função para exportar relatório detalhado de lojas em PDF
    const exportarRelatorioLojasPDF = () => {
      const dados = relatorioLojas.filter(r => r.temAtividade);
      if (dados.length === 0) {
        alert('Nenhum dado para exportar no período selecionado.');
        return;
      }

      const doc = new jsPDF();
      let currentY = 20;

      dados.forEach((relatorio, index) => {
        if (index > 0) {
          doc.addPage();
          currentY = 20;
        }

        // Cabeçalho da loja
        doc.setFontSize(16);
        doc.text(`EXPRESSO NEVES - RELATÓRIO DA LOJA: ${relatorio.loja.nome}`, 20, currentY);
        currentY += 10;

        doc.setFontSize(12);
        doc.text(`Período: ${weekStart.toLocaleDateString('pt-BR')} a ${weekEnd.toLocaleDateString('pt-BR')}`, 20, currentY);
        currentY += 7;
        doc.text(`CNPJ: ${relatorio.loja.cnpj}`, 20, currentY);
        currentY += 7;
        doc.text(`Contato: ${relatorio.loja.contato}`, 20, currentY);
        currentY += 15;

        // Resumo financeiro
        doc.setFontSize(14);
        doc.text('RESUMO FINANCEIRO:', 20, currentY);
        currentY += 10;

        doc.setFontSize(12);
        doc.text(`Valor Logística: R$ ${relatorio.valorLogistica.toFixed(2)}`, 30, currentY);
        currentY += 7;
        doc.text(`Taxa Administrativa: R$ ${relatorio.comissaoAdministrativa.toFixed(2)}`, 30, currentY);
        currentY += 7;
        doc.text(`Taxa Supervisão: R$ ${relatorio.taxaSupervisao.toFixed(2)}`, 30, currentY);
        currentY += 7;
        
        doc.setFontSize(14);
        doc.text(`TOTAL A PAGAR: R$ ${relatorio.valorTotal.toFixed(2)}`, 30, currentY);
        currentY += 15;

        // Detalhamento por motoboy
        doc.setFontSize(14);
        doc.text('DETALHAMENTO POR MOTOBOY:', 20, currentY);
        currentY += 10;

        // Consolidar dados por motoboy para o PDF
        const motoboyConsolidado = {};
        
        relatorio.jornadasLoja.forEach(jornada => {
          const motoboy = motoboys.find(m => m.id === jornada.motoboyId);
          const motoboyNome = motoboy?.nome || 'N/A';
          const detalhes = calcularDetalhesJornada(jornada);
          const totalExtras = detalhes.valorComissoes + detalhes.valorMissoes;
          
          if (!motoboyConsolidado[jornada.motoboyId]) {
            motoboyConsolidado[jornada.motoboyId] = {
              nome: motoboyNome,
              totalHoras: 0,
              totalJornadas: 0,
              totalCorridasAte5km: 0,
              totalCorridasAcima5km: 0,
              totalValorCorridas: 0,
              totalExtras: 0,
              totalPago: 0
            };
          }
          
          motoboyConsolidado[jornada.motoboyId].totalHoras += detalhes.horasTrabalhadas;
          motoboyConsolidado[jornada.motoboyId].totalJornadas += 1;
          motoboyConsolidado[jornada.motoboyId].totalCorridasAte5km += (jornada.corridasAte5km || 0);
          motoboyConsolidado[jornada.motoboyId].totalCorridasAcima5km += (jornada.corridasAcima5km || 0);
          motoboyConsolidado[jornada.motoboyId].totalValorCorridas += detalhes.valorCorridas;
          motoboyConsolidado[jornada.motoboyId].totalExtras += totalExtras;
          motoboyConsolidado[jornada.motoboyId].totalPago += detalhes.valorTotal;
        });

        const tableData = Object.values(motoboyConsolidado).map(motoboy => [
          motoboy.nome,
          `${motoboy.totalHoras.toFixed(1)}h`,
          motoboy.totalJornadas.toString(),
          motoboy.totalCorridasAte5km.toString(),
          motoboy.totalCorridasAcima5km.toString(),
          `R$ ${motoboy.totalValorCorridas.toFixed(2)}`,
          `R$ ${motoboy.totalExtras.toFixed(2)}`,
          `R$ ${motoboy.totalPago.toFixed(2)}`
        ]);

        // Adicionar linha de total
        tableData.push([
          'TOTAL LOGÍSTICA:',
          '',
          '',
          '',
          '',
          '',
          '',
          `R$ ${relatorio.valorLogistica.toFixed(2)}`
        ]);

        autoTable(doc, {
          head: [['Motoboy', 'Total Horas', 'Jornadas', '≤5km', '>5km', 'Corridas', 'Extras', 'Total']],
          body: tableData,
          startY: currentY,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] },
          margin: { left: 20, right: 20 }
        });
      });

      doc.save(`relatorio_detalhado_lojas_${weekStart.toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
    };

    // Função para calcular detalhes da jornada (reutilizada)
    const calcularDetalhesJornada = (jornada) => {
      if (!jornada) return { horasTrabalhadas: 0, valorDiaria: 0, valorHoras: 0, valorCorridas: 0, valorComissoes: 0, valorMissoes: 0, valorTotal: 0 };
      
      const loja = lojas.find(l => l.id === jornada.lojaId);
      
      if (!loja) return { horasTrabalhadas: 0, valorDiaria: 0, valorHoras: 0, valorCorridas: 0, valorComissoes: 0, valorMissoes: 0, valorTotal: 0 };

      const horasTrabalhadas = calcularHorasTrabalhadas(jornada.horasEntrada, jornada.horasSaida);
      const valorDiaria = Number(jornada.valorDiaria) || 0;
      
      // Valor por horas trabalhadas
      const valorHoraSegSab = Number(loja.valorHoraSegSab) || 0;
      const valorHoraDomFeriado = Number(loja.valorHoraDomFeriado) || 0;
      const valorPorHora = isDomingoOuFeriado(jornada.data, jornada.eFeriado) 
        ? valorHoraDomFeriado 
        : valorHoraSegSab;
      const valorHoras = horasTrabalhadas * valorPorHora;
      
      const corridasAte5km = Number(jornada.corridasAte5km) || 0;
      const corridasAcima5km = Number(jornada.corridasAcima5km) || 0;
      const valorCorridaAte5km = Number(loja.valorCorridaAte5km) || 0;
      const valorCorridaAcima5km = Number(loja.valorCorridaAcima5km) || 0;
      const valorCorridas = (corridasAte5km * valorCorridaAte5km) + (corridasAcima5km * valorCorridaAcima5km);
      const valorComissoes = Number(jornada.comissoes) || 0;
      const valorMissoes = Number(jornada.missoes) || 0;
      const valorTotal = valorDiaria + valorHoras + valorCorridas + valorComissoes + valorMissoes;

      return { horasTrabalhadas, valorDiaria, valorHoras, valorCorridas, valorComissoes, valorMissoes, valorTotal: isNaN(valorTotal) ? 0 : valorTotal };
    };

    // Filtrar lojas baseado no filtro selecionado
    const lojasParaRelatorio = filtroLoja ? lojas.filter(l => l.id === filtroLoja) : lojas;

    // Relatório por Motoboy (aplicando filtro de loja)
    const relatorioMotoboys = motoboys
      .filter(m => m.status === 'ativo')
      .map(motoboy => {
        const jornadasMotoboy = jornadasSemana.filter(j => j.motoboyId === motoboy.id);
        const adiantamentosMotoboy = adiantamentosSemana.filter(a => a.motoboyId === motoboy.id);
        
        const totalHoras = jornadasMotoboy.reduce((sum, j) => {
          const horas = calcularHorasTrabalhadas(j.horasEntrada, j.horasSaida);
          return sum + (isNaN(horas) ? 0 : horas);
        }, 0);
        
        const totalCorridasAte5km = jornadasMotoboy.reduce((sum, j) => sum + (Number(j.corridasAte5km) || 0), 0);
        const totalCorridasAcima5km = jornadasMotoboy.reduce((sum, j) => sum + (Number(j.corridasAcima5km) || 0), 0);
        const totalCorridas = totalCorridasAte5km + totalCorridasAcima5km;
        
        // CORRIGIDO: Cálculo correto do valor bruto
        const valorBruto = jornadasMotoboy.reduce((sum, j) => {
          const valorJornada = calcularValorJornada(j);
          return sum + (isNaN(valorJornada) || valorJornada < 0 ? 0 : valorJornada);
        }, 0);
        
        // CORRIGIDO: Cálculo correto dos adiantamentos
        const totalAdiantamentos = adiantamentosMotoboy.reduce((sum, a) => {
          const valorAdiantamento = Number(a.valor) || 0;
          return sum + (valorAdiantamento < 0 ? 0 : valorAdiantamento);
        }, 0);
        
        // CORRIGIDO: Valor líquido = valor bruto - adiantamentos
        const valorLiquido = valorBruto - totalAdiantamentos;

        return {
          motoboy,
          totalHoras,
          totalCorridas,
          totalCorridasAte5km,
          totalCorridasAcima5km,
          valorBruto,
          totalAdiantamentos,
          valorLiquido,
          temAtividade: jornadasMotoboy.length > 0 || adiantamentosMotoboy.length > 0
        };
      });

    // Relatório por Loja (aplicando filtro)
    const relatorioLojas = lojasParaRelatorio.map(loja => {
      const jornadasLoja = jornadasSemana.filter(j => j.lojaId === loja.id);
      
      // CORRIGIDO: Cálculo correto da logística (soma dos valores das jornadas)
      const valorLogistica = jornadasLoja.reduce((sum, j) => {
        const valorJornada = calcularValorJornada(j);
        return sum + (isNaN(valorJornada) || valorJornada < 0 ? 0 : valorJornada);
      }, 0);
      
      // Taxa administrativa (valor fixo da loja)
      const taxaAdministrativa = Number(loja.taxaAdministrativa) || 0;
      
      // Taxa de supervisão (valor fixo se houver atividade)
      const taxaSupervisao = jornadasLoja.length > 0 ? (Number(loja.taxaSupervisao) || 0) : 0;
      
      // Total = logística + taxa admin + taxa supervisão
      const valorTotal = valorLogistica + taxaAdministrativa + taxaSupervisao;

      return {
        loja,
        jornadasLoja,
        valorLogistica,
        comissaoAdministrativa: taxaAdministrativa,
        taxaSupervisao,
        valorTotal,
        temAtividade: jornadasLoja.length > 0
      };
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold">Relatórios Semanais</h2>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <label className="text-sm font-medium">Semana:</label>
              <input
                type="date"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-500 ml-2">
                {weekStart.toLocaleDateString('pt-BR')} a {weekEnd.toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
          
          {/* Filtro por Loja */}
          {currentUser?.tipo !== 'lojista' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <label className="text-sm font-medium text-gray-700">Filtrar por Loja:</label>
                <select
                  value={filtroLoja}
                  onChange={(e) => setFiltroLoja(e.target.value)}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
                >
                  <option value="">Todas as Lojas</option>
                  {lojas
                    .filter(loja => canAccessLoja(loja.id))
                    .map(loja => (
                      <option key={loja.id} value={loja.id}>{loja.nome}</option>
                    ))}
                </select>
                {filtroLoja && (
                  <button
                    onClick={() => setFiltroLoja('')}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Limpar filtro
                  </button>
                )}
              </div>
            </div>
          )}
          
          {currentUser?.tipo === 'lojista' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Visualizando dados da loja:</strong> {lojas.find(l => l.id === currentUser.lojaId)?.nome || 'Loja não encontrada'}
              </div>
            </div>
          )}
        </div>

        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800">Motoboys com Atividade</h3>
            <p className="text-xl font-bold text-blue-600">{relatorioMotoboys.filter(r => r.temAtividade).length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-800">Lojas com Atividade</h3>
            <p className="text-xl font-bold text-green-600">{relatorioLojas.filter(r => r.temAtividade).length}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-800">Total de Jornadas</h3>
            <p className="text-xl font-bold text-purple-600">{jornadasSemana.length}</p>
          </div>
        </div>

        {/* Relatório de Motoboys */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Relatório de Motoboys</h3>
            <div className="flex gap-2">
              <button 
                onClick={exportarRelatorioMotoboyCSV}
                className="flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
              >
                <Download size={16} />
                CSV
              </button>
              <button 
                onClick={exportarRelatorioMotoboyPDF}
                className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
              >
                <Download size={16} />
                PDF
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Motoboy</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Horas</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Corridas</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">≤5km | >5km</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Valor Bruto</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Adiantamentos</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Valor Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {relatorioMotoboys.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      Nenhum motoboy ativo cadastrado
                    </td>
                  </tr>
                ) : relatorioMotoboys.filter(r => r.temAtividade).length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      Nenhuma atividade registrada para o período selecionado
                    </td>
                  </tr>
                ) : (
                  relatorioMotoboys
                    .filter(r => r.temAtividade)
                    .map(relatorio => (
                      <tr key={relatorio.motoboy.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{relatorio.motoboy.nome}</td>
                        <td className="px-4 py-3">{relatorio.totalHoras.toFixed(1)}h</td>
                        <td className="px-4 py-3">{relatorio.totalCorridas}</td>
                        <td className="px-4 py-3">{relatorio.totalCorridasAte5km} | {relatorio.totalCorridasAcima5km}</td>
                        <td className="px-4 py-3">R$ {relatorio.valorBruto.toFixed(2)}</td>
                        <td className="px-4 py-3">R$ {relatorio.totalAdiantamentos.toFixed(2)}</td>
                        <td className="px-4 py-3 font-semibold">R$ {relatorio.valorLiquido.toFixed(2)}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Relatório Detalhado de Lojas */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Relatório Detalhado de Lojas</h3>
            <div className="flex gap-2">
              <button 
                onClick={exportarRelatorioLojasCSV}
                className="flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
              >
                <Download size={16} />
                CSV
              </button>
              <button 
                onClick={exportarRelatorioLojasPDF}
                className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
              >
                <Download size={16} />
                PDF
              </button>
            </div>
          </div>
          
          {relatorioLojas.filter(r => r.temAtividade).length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {filtroLoja ? 'Nenhuma atividade registrada para a loja selecionada no período.' : 'Nenhuma atividade registrada para o período selecionado.'}
            </div>
          ) : (
            <div className="space-y-6">
              {relatorioLojas
                .filter(r => r.temAtividade)
                .map(relatorio => (
                  <div key={relatorio.loja.id} className="border rounded-lg p-4 bg-gray-50">
                    {/* Cabeçalho da Loja */}
                    <div className="mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-semibold text-gray-800">{relatorio.loja.nome}</h4>
                        <div className="text-sm text-gray-600">
                          Período: {weekStart.toLocaleDateString('pt-BR')} a {weekEnd.toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>CNPJ: {relatorio.loja.cnpj}</div>
                        <div>Contato: {relatorio.loja.contato}</div>
                      </div>
                    </div>

                    {/* Resumo Financeiro */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-blue-50 p-3 rounded border">
                        <div className="text-xs text-blue-600 font-medium">LOGÍSTICA</div>
                        <div className="text-lg font-bold text-blue-800">R$ {relatorio.valorLogistica.toFixed(2)}</div>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded border">
                        <div className="text-xs text-yellow-600 font-medium">TAXA ADMIN</div>
                        <div className="text-lg font-bold text-yellow-800">R$ {relatorio.comissaoAdministrativa.toFixed(2)}</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded border">
                        <div className="text-xs text-purple-600 font-medium">SUPERVISÃO</div>
                        <div className="text-lg font-bold text-purple-800">R$ {relatorio.taxaSupervisao.toFixed(2)}</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded border border-red-300">
                        <div className="text-xs text-red-600 font-medium">TOTAL A PAGAR</div>
                        <div className="text-xl font-bold text-red-800">R$ {relatorio.valorTotal.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Detalhamento por Motoboy */}
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Detalhamento por Motoboy:</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-white">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Motoboy</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Total Horas</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Jornadas</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">≤5km</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">>5km</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Valor Corridas</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Extras</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Total Pago</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {(() => {
                              // Consolidar dados por motoboy
                              const motoboyConsolidado = {};
                              
                              relatorio.jornadasLoja.forEach(jornada => {
                                const motoboy = motoboys.find(m => m.id === jornada.motoboyId);
                                const motoboyNome = motoboy?.nome || 'N/A';
                                const detalhes = calcularDetalhesJornada(jornada);
                                const totalExtras = detalhes.valorComissoes + detalhes.valorMissoes;
                                
                                if (!motoboyConsolidado[jornada.motoboyId]) {
                                  motoboyConsolidado[jornada.motoboyId] = {
                                    nome: motoboyNome,
                                    totalHoras: 0,
                                    totalJornadas: 0,
                                    totalCorridasAte5km: 0,
                                    totalCorridasAcima5km: 0,
                                    totalValorCorridas: 0,
                                    totalExtras: 0,
                                    totalPago: 0
                                  };
                                }
                                
                                motoboyConsolidado[jornada.motoboyId].totalHoras += detalhes.horasTrabalhadas;
                                motoboyConsolidado[jornada.motoboyId].totalJornadas += 1;
                                motoboyConsolidado[jornada.motoboyId].totalCorridasAte5km += (jornada.corridasAte5km || 0);
                                motoboyConsolidado[jornada.motoboyId].totalCorridasAcima5km += (jornada.corridasAcima5km || 0);
                                motoboyConsolidado[jornada.motoboyId].totalValorCorridas += detalhes.valorCorridas;
                                motoboyConsolidado[jornada.motoboyId].totalExtras += totalExtras;
                                motoboyConsolidado[jornada.motoboyId].totalPago += detalhes.valorTotal;
                              });
                              
                              return Object.values(motoboyConsolidado).map((motoboy, index) => (
                                <tr key={index} className="hover:bg-white">
                                  <td className="px-3 py-2 font-medium">{motoboy.nome}</td>
                                  <td className="px-3 py-2">{motoboy.totalHoras.toFixed(1)}h</td>
                                  <td className="px-3 py-2">{motoboy.totalJornadas}</td>
                                  <td className="px-3 py-2">{motoboy.totalCorridasAte5km}</td>
                                  <td className="px-3 py-2">{motoboy.totalCorridasAcima5km}</td>
                                  <td className="px-3 py-2 text-green-600">R$ {motoboy.totalValorCorridas.toFixed(2)}</td>
                                  <td className="px-3 py-2 text-purple-600">R$ {motoboy.totalExtras.toFixed(2)}</td>
                                  <td className="px-3 py-2 font-medium">R$ {motoboy.totalPago.toFixed(2)}</td>
                                </tr>
                              ));
                            })()}
                            {/* Linha de Total */}
                            <tr className="bg-gray-100 font-medium">
                              <td className="px-3 py-2" colSpan="7">TOTAL LOGÍSTICA:</td>
                              <td className="px-3 py-2">R$ {relatorio.valorLogistica.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Resumo Final */}
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-1">VALOR TOTAL A PAGAR PELA LOJA:</div>
                          <div className="text-2xl font-bold text-red-800">
                            R$ {relatorio.valorTotal.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            (Logística: R$ {relatorio.valorLogistica.toFixed(2)} + Taxa Admin: R$ {relatorio.comissaoAdministrativa.toFixed(2)} + Supervisão: R$ {relatorio.taxaSupervisao.toFixed(2)})
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Navegação baseada em permissões
  const getAvailableTabs = () => {
    const allTabs = [
      { id: 'dashboard', label: 'Dashboard', icon: FileText, component: Dashboard, permission: 'viewDashboard' },
      { id: 'motoboys', label: 'Motoboys', icon: Users, component: MotoboysTab, permission: 'manageMotoboys' },
      { id: 'lojas', label: 'Lojas', icon: Store, component: LojasTab, permission: 'manageLojas' },
      { id: 'jornadas', label: 'Jornadas', icon: Calendar, component: JornadasTab, permission: 'manageJornadas' },
      { id: 'adiantamentos', label: 'Adiantamentos', icon: DollarSign, component: AdiantamentosTab, permission: 'manageAdiantamentos' },
      { id: 'debitos', label: 'Débitos Pendentes', icon: DollarSign, component: DebitosPendentesTab, permission: 'manageAdiantamentos' },
      { id: 'relatorios', label: 'Relatórios', icon: FileText, component: RelatoriosTab, permission: 'viewRelatorios' },
      { id: 'colaboradores', label: 'Colaboradores', icon: Users, component: ColaboradoresTab, permission: 'manageColaboradores' },
    ];

    return allTabs.filter(tab => hasPermission(tab.permission));
  };

  const tabs = getAvailableTabs();

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || Dashboard;

  // Verificar se o usuário está autenticado
  if (!isAuthenticated || !currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="assets/JeFG5upo7Hg6wrzGnryGF.jpeg" 
              alt="Expresso Neves" 
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Expresso Neves</h1>
              <p className="text-sm text-gray-600">Sistema de Gestão de Motoboys</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{currentUser?.nome}</div>
              <div className="text-xs text-gray-500">
                {currentUser?.tipo === 'admin' && 'Administrador'}
                {currentUser?.tipo === 'financeiro' && 'Financeiro'}
                {currentUser?.tipo === 'lojista' && 'Lojista'}
                {currentUser?.tipo === 'lojista' && currentUser?.lojaId && 
                  ` - ${lojas.find(l => l.id === currentUser.lojaId)?.nome || 'Loja não encontrada'}`
                }
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              title="Sair"
            >
              <Settings size={20} />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm border-r overflow-y-auto">
          <div className="p-4">
            <ul className="space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={20} />
                      {tab.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <ActiveComponent />
        </main>
      </div>

      {/* Modais */}
      <MotoboyModal />
      <LojaModal />
      <JornadaModal />
      <AdiantamentoModal />
      <DebitoModal />
      <ColaboradorModal />
    </div>
  );
};

export default MotoboysSystem;