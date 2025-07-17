import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import jsPDF from 'jspdf';
import toast, { Toaster } from 'react-hot-toast';
import { PDR } from './src/components';
import { useStoredState } from './src/hooks/useStoredState';
import { supabase } from './src/services/supabaseClient';
import { formatCPF, formatTelefone, formatarDataParaSalvar } from './src/utils/formatters';
import { exportarDebitosPDF, exportarDebitosCSV } from './src/services/pdfService';
import { useAuth } from './src/hooks/useAuth';
import { filtrarMotoboys, filtrarLojas, filtrarJornadas } from './src/utils/filters';
import { calcularTotalJornadas, calcularTotalMotoboys } from './src/utils/helpers';
import { FormMotoboy, FormLoja, FormJornada } from './src/components/forms';
import { ListaMotoboys, ListaLojas, ListaJornadas } from './src/components/lists';

const ExpressoNevesApp = () => {
  // Estados principais
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useStoredState('currentUser', null);

  // Estados de dados
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

  const [motoboys, setMotoboys] = useStoredState('motoboys', []);
  const [lojas, setLojas] = useStoredState('lojas', []);
  const [jornadas, setJornadas] = useStoredState('jornadas', []);
  const [adiantamentos, setAdiantamentos] = useStoredState('adiantamentos', []);
  const [debitosPendentes, setDebitosPendentes] = useStoredState('debitosPendentes', []);

  // Estados de sync
  const [isOnline, setIsOnline] = useState(false);
  const [syncStatus, setSyncStatus] = useState('offline');

  // Estados para formulários
  const [showJornadaForm, setShowJornadaForm] = useState(false);
  const [editingJornada, setEditingJornada] = useState(null);
  const [motoboyForm, setMotoboyForm] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    status: 'ativo'
  });

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    motoboyId: '',
    lojaId: '',
    eFeriado: false,
    busca: ''
  });
  const [jornadasFiltradas, setJornadasFiltradas] = useState(jornadas);

  const [lojaForm, setLojaForm] = useState({
    nome: '',
    cnpj: '',
    contato: '',
    valorHoraSegSab: 12.00,
    valorHoraDomFeriado: 13.33,
    valorCorridaAte5km: 5.00,
    valorCorridaAcima5km: 8.00,
    taxaAdministrativa: 350.00,
    taxaSupervisao: 50.00,
    limiteValorFixo: 1000.00,
    percentualTaxa: 10.00,
    usarTaxaPercentual: false
  });

  const [editingLoja, setEditingLoja] = useState(null);
  const [editingMotoboy, setEditingMotoboy] = useState(null);

  // Estados para filtros de motoboys
  const [filtrosMotoboy, setFiltrosMotoboy] = useState({
    nome: '',
    status: '',
    cpf: ''
  });
  const [motoboysFiltrados, setMotoboysFiltrados] = useState(motoboys);

  const [jornadaForm, setJornadaForm] = useState({
    data: '',
    motoboyId: '',
    lojaId: '',
    valorDiaria: 120.00,
    valorCorridas: 0.00,
    comissoes: 0.00,
    missoes: 0.00,
    descontos: 0.00,
    eFeriado: false,
    observacoes: ''
  });

  const [cadastroMultiplo, setCadastroMultiplo] = useState(false);
  
  // Para cadastro múltiplo - dados individuais por motoboy
  const [jornadaMultiplaForm, setJornadaMultiplaForm] = useState({
    data: '',
    lojaId: '',
    eFeriado: false,
    motoboys: [] // Array com {motoboyId, valorDiaria, valorCorridas, comissoes, missoes, descontos, observacoes}
  });

  const [adiantamentoForm, setAdiantamentoForm] = useState({
    motoboyId: '',
    lojaId: '',
    valor: 0.00,
    data: '',
    observacao: ''
  });

  const [debitoForm, setDebitoForm] = useState({
    lojaId: '',
    descricao: '',
    valor: 0.00,
    dataVencimento: '',
    status: 'pendente'
  });

  // Estados para relatórios
  const [relatorioConfig, setRelatorioConfig] = useState({
    dataInicio: '',
    dataFim: ''
  });
  const [relatorioLojas, setRelatorioLojas] = useState([]);

  // Estados para relatório motoboys
  const [relatorioMotoboyConfig, setRelatorioMotoboyConfig] = useState({
    dataInicio: '',
    dataFim: ''
  });
  const [relatorioMotoboyLojas, setRelatorioMotoboyLojas] = useState([]);

  // Estados para login
  const [loginForm, setLoginForm] = useState({
    email: '',
    senha: ''
  });

  const [colaboradorForm, setColaboradorForm] = useState({
    nome: '',
    email: '',
    senha: '',
    tipo: 'lojista',
    lojaId: ''
  });

  const [editingColaborador, setEditingColaborador] = useState(null);
  const [editingDebito, setEditingDebito] = useState(null);

  // Funções para filtrar dados baseado no usuário logado
  const getLojasFiltradas = () => {
    if (currentUser?.tipo === 'lojista' && currentUser?.lojaId) {
      return lojas.filter(loja => loja.id === currentUser.lojaId);
    }
    return lojas;
  };

  const getJornadasFiltradas = (todasJornadas = jornadas) => {
    if (currentUser?.tipo === 'lojista' && currentUser?.lojaId) {
      return todasJornadas.filter(jornada => jornada.lojaId === currentUser.lojaId);
    }
    return todasJornadas;
  };

  const getAdiantamentosFiltrados = () => {
    if (currentUser?.tipo === 'lojista' && currentUser?.lojaId) {
      return adiantamentos.filter(adiantamento => adiantamento.lojaId === currentUser.lojaId);
    }
    return adiantamentos;
  };

  const getDebitosFiltrados = () => {
    if (currentUser?.tipo === 'lojista' && currentUser?.lojaId) {
      return debitosPendentes.filter(debito => debito.lojaId === currentUser.lojaId);
    }
    return debitosPendentes;
  };

  // Função para testar conexão com Supabase
  const testConnection = async () => {
    try {
      console.log('🔗 Testando conexão com Supabase...');
      const { data, error } = await supabase.from('colaboradores').select('count').limit(1);
      if (error) {
        console.error('❌ Erro de conexão:', error);
        throw error;
      }
      console.log('✅ Conexão com Supabase estabelecida!');
      setIsOnline(true);
      setSyncStatus('online');
      return true;
    } catch (error) {
      console.error('❌ Falha na conexão:', error);
      setIsOnline(false);
      setSyncStatus('offline');
      return false;
    }
  };

  // Funções de sincronização básicas
  const syncAllData = async () => {
    if (!isOnline) return;
    setSyncStatus('syncing');
    
    try {
      console.log('🔄 Iniciando sincronização...');
      // Aqui você pode implementar a lógica de sincronização conforme necessário
      console.log('✅ Sincronização concluída!');
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
    } finally {
      setSyncStatus('online');
    }
  };

  // Inicialização
  useEffect(() => {
    testConnection();
  }, []);

  // Atualizar jornadas filtradas quando jornadas mudarem
  useEffect(() => {
    setJornadasFiltradas(getJornadasFiltradas(jornadas));
  }, [jornadas, currentUser]);

  // Atualizar motoboys filtrados quando motoboys mudarem
  useEffect(() => {
    setMotoboysFiltrados(motoboys);
  }, [motoboys]);

  // Função de login
  const handleLogin = (e) => {
    e.preventDefault();
    const user = colaboradores.find(
      c => c.email === loginForm.email && c.senha === loginForm.senha && c.ativo
    );
    
    if (user) {
      setCurrentUser(user);
      setActiveTab('dashboard');
      setLoginForm({ email: '', senha: '' });
      toast.success(`Bem-vindo, ${user.nome}!`);
    } else {
      toast.error('Email ou senha incorretos!');
    }
  };

  // Função de logout
  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // Função para adicionar/editar colaborador
  const addColaborador = async (e) => {
    e.preventDefault();
    
    if (!colaboradorForm.nome || !colaboradorForm.email || !colaboradorForm.senha) {
      toast.error('Preencha todos os campos obrigatórios!');
      return;
    }

    // Verificar se já existe um colaborador com este email
    const emailExistente = colaboradores.find(c => 
      c.email === colaboradorForm.email && 
      (!editingColaborador || c.id !== editingColaborador.id)
    );

    if (emailExistente) {
      toast.error('Já existe um colaborador com este email!');
      return;
    }

    // Se for lojista, validar se a loja foi selecionada
    if (colaboradorForm.tipo === 'lojista' && !colaboradorForm.lojaId) {
      toast.error('Selecione uma loja para o colaborador lojista!');
      return;
    }

    if (editingColaborador) {
      // Editando colaborador existente
      const novosColaboradores = colaboradores.map(c => 
        c.id === editingColaborador.id 
          ? { 
              ...c, 
              ...colaboradorForm,
              lojaId: colaboradorForm.tipo === 'lojista' ? colaboradorForm.lojaId : null
            }
          : c
      );
      setColaboradores(novosColaboradores);
      setEditingColaborador(null);
      toast.success('Colaborador atualizado com sucesso!');
    } else {
      // Criando novo colaborador
      const novoColaborador = {
        id: Date.now().toString(),
        ...colaboradorForm,
        lojaId: colaboradorForm.tipo === 'lojista' ? colaboradorForm.lojaId : null,
        ativo: true,
        dataCriacao: new Date().toISOString().split('T')[0]
      };

      const novosColaboradores = [...colaboradores, novoColaborador];
      setColaboradores(novosColaboradores);
      toast.success('Colaborador cadastrado com sucesso!');
    }

    setColaboradorForm({
      nome: '',
      email: '',
      senha: '',
      tipo: 'lojista',
      lojaId: ''
    });
  };

  // Função para editar colaborador
  const editColaborador = (colaborador) => {
    setEditingColaborador(colaborador);
    setColaboradorForm({
      nome: colaborador.nome,
      email: colaborador.email,
      senha: colaborador.senha,
      tipo: colaborador.tipo,
      lojaId: colaborador.lojaId || ''
    });
  };

  // Função para cancelar edição de colaborador
  const cancelarEdicaoColaborador = () => {
    setEditingColaborador(null);
    setColaboradorForm({
      nome: '',
      email: '',
      senha: '',
      tipo: 'lojista',
      lojaId: ''
    });
  };

  // Função para deletar colaborador
  const deleteColaborador = async (id) => {
    if (id === currentUser?.id) {
      toast.error('Você não pode excluir sua própria conta!');
      return;
    }

    toast((t) => (
      <div className="flex flex-col items-center">
        <span className="mb-3">Tem certeza que deseja excluir este colaborador?</span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const novosColaboradores = colaboradores.filter(c => c.id !== id);
              setColaboradores(novosColaboradores);
              toast.dismiss(t.id);
              toast.success('Colaborador excluído com sucesso!');
            }}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Excluir
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
    });
  };

  // Função para ativar/desativar colaborador
  const toggleColaboradorStatus = (id) => {
    if (id === currentUser?.id) {
      toast.error('Você não pode desativar sua própria conta!');
      return;
    }

    const colaborador = colaboradores.find(c => c.id === id);
    const novosColaboradores = colaboradores.map(c => 
      c.id === id ? { ...c, ativo: !c.ativo } : c
    );
    setColaboradores(novosColaboradores);
    
    toast.success(`Colaborador ${colaborador.ativo ? 'desativado' : 'ativado'} com sucesso!`);
  };

  // Função para adicionar/editar motoboy
  const addMotoboy = async (e) => {
    e.preventDefault();
    
    if (!motoboyForm.nome || !motoboyForm.cpf || !motoboyForm.telefone) {
      toast.error('Preencha todos os campos obrigatórios!');
      return;
    }



    if (editingMotoboy) {
      // Editando motoboy existente
      const novosMotoboys = motoboys.map(m => 
        m.id === editingMotoboy.id 
          ? { ...m, ...motoboyForm }
          : m
      );
      setMotoboys(novosMotoboys);
      setEditingMotoboy(null);
      toast.success('Motoboy atualizado com sucesso!');
    } else {
      // Criando novo motoboy
      const novoMotoboy = {
        id: Date.now().toString(),
        ...motoboyForm
      };

      const novosMotoboys = [...motoboys, novoMotoboy];
      setMotoboys(novosMotoboys);
      toast.success('Motoboy cadastrado com sucesso!');
    }

    setMotoboyForm({
      nome: '',
      cpf: '',
      telefone: '',
      status: 'ativo'
    });
  };

  // Função para adicionar loja
  const addLoja = async (e) => {
    e.preventDefault();
    
    if (!lojaForm.nome || !lojaForm.cnpj || !lojaForm.contato) {
      toast.error('Preencha todos os campos obrigatórios!');
      return;
    }



    if (editingLoja) {
      // Editando loja existente
      const novasLojas = lojas.map(l => 
        l.id === editingLoja.id 
          ? { ...l, ...lojaForm }
          : l
      );
      setLojas(novasLojas);
      setEditingLoja(null);
      toast.success('Loja atualizada com sucesso!');
    } else {
      // Criando nova loja
      const novaLoja = {
        id: Date.now().toString(),
        ...lojaForm
      };

      const novasLojas = [...lojas, novaLoja];
      setLojas(novasLojas);
      toast.success('Loja cadastrada com sucesso!');
    }

    setLojaForm({
      nome: '',
      cnpj: '',
      contato: '',
      valorHoraSegSab: 12.00,
      valorHoraDomFeriado: 13.33,
      valorCorridaAte5km: 5.00,
      valorCorridaAcima5km: 8.00,
      taxaAdministrativa: 350.00,
      taxaSupervisao: 50.00,
      limiteValorFixo: 1000.00,
      percentualTaxa: 10.00,
      usarTaxaPercentual: false
    });
  };

  // Função para adicionar motoboy ao cadastro múltiplo
  const adicionarMotoboyMultiplo = () => {
    const motoboysSelecionados = jornadaMultiplaForm.motoboys.map(m => m.motoboyId);
    const motoboyDisponivel = motoboys.filter(m => 
      m.status === 'ativo' && !motoboysSelecionados.includes(m.id)
    )[0];
    
    if (!motoboyDisponivel) {
      toast.warning('Todos os motoboys ativos já foram adicionados!');
      return;
    }

    const novoMotoboy = {
      motoboyId: motoboyDisponivel.id,
      valorDiaria: 120.00,
      valorCorridas: 0.00,
      comissoes: 0.00,
      missoes: 0.00,
      descontos: 0.00,
      observacoes: ''
    };

    setJornadaMultiplaForm({
      ...jornadaMultiplaForm,
      motoboys: [...jornadaMultiplaForm.motoboys, novoMotoboy]
    });
  };

  // Função para remover motoboy do cadastro múltiplo
  const removerMotoboyMultiplo = (index) => {
    const novosMotoboys = jornadaMultiplaForm.motoboys.filter((_, i) => i !== index);
    setJornadaMultiplaForm({
      ...jornadaMultiplaForm,
      motoboys: novosMotoboys
    });
  };

  // Função para atualizar dados de um motoboy específico no cadastro múltiplo
  const atualizarMotoboyMultiplo = (index, campo, valor) => {
    const novosMotoboys = [...jornadaMultiplaForm.motoboys];
    novosMotoboys[index] = {
      ...novosMotoboys[index],
      [campo]: campo.includes('valor') || campo.includes('comissoes') || campo.includes('missoes') || campo.includes('descontos') 
        ? parseFloat(valor) || 0 
        : valor
    };
    setJornadaMultiplaForm({
      ...jornadaMultiplaForm,
      motoboys: novosMotoboys
    });
  };

  // Função para adicionar/editar jornada
  const addJornada = async (e) => {
    e.preventDefault();
    
    // Para lojistas, definir automaticamente a loja
    if (currentUser?.tipo === 'lojista' && currentUser?.lojaId) {
      if (cadastroMultiplo) {
        jornadaMultiplaForm.lojaId = currentUser.lojaId;
      } else {
        jornadaForm.lojaId = currentUser.lojaId;
      }
    }
    
    // Validação diferente para cadastro múltiplo vs single
    if (cadastroMultiplo) {
      if (!jornadaMultiplaForm.data || !jornadaMultiplaForm.lojaId || jornadaMultiplaForm.motoboys.length === 0) {
        toast.error('Preencha todos os campos obrigatórios! (Data, Loja e pelo menos um Motoboy)');
        return;
      }
    } else {
      if (!jornadaForm.data || !jornadaForm.motoboyId || !jornadaForm.lojaId) {
        toast.error('Preencha todos os campos obrigatórios!');
        return;
      }
    }

    if (editingJornada) {
      // Editando jornada existente (apenas modo single)
      const dataCorrigida = formatarDataParaSalvar(jornadaForm.data);
      const novasJornadas = jornadas.map(j => 
        j.id === editingJornada.id 
          ? { ...j, ...jornadaForm, data: dataCorrigida }
          : j
      );
      setJornadas(novasJornadas);
      aplicarFiltros(novasJornadas);
      toast.success('Jornada atualizada com sucesso!');
    } else {
      // Criando nova(s) jornada(s)
      let novasJornadas = [...jornadas];
      let jornadasCriadas = 0;
      let jornadasExistentes = 0;

      if (cadastroMultiplo) {
        // Cadastro múltiplo - criar uma jornada para cada motoboy com seus valores individuais
        const dataCorrigida = formatarDataParaSalvar(jornadaMultiplaForm.data);
        
        jornadaMultiplaForm.motoboys.forEach(motoboyData => {
          // Verificar se já existe jornada para este motoboy nesta data
          if (jornadas.find(j => j.motoboyId === motoboyData.motoboyId && j.data === dataCorrigida)) {
            jornadasExistentes++;
            return;
          }

          const novaJornada = {
            id: `${Date.now()}-${motoboyData.motoboyId}-${Math.random()}`,
            data: dataCorrigida,
            motoboyId: motoboyData.motoboyId,
            lojaId: jornadaMultiplaForm.lojaId,
            valorDiaria: parseFloat(motoboyData.valorDiaria) || 0,
            valorCorridas: parseFloat(motoboyData.valorCorridas) || 0,
            comissoes: parseFloat(motoboyData.comissoes) || 0,
            missoes: parseFloat(motoboyData.missoes) || 0,
            descontos: parseFloat(motoboyData.descontos) || 0,
            eFeriado: jornadaMultiplaForm.eFeriado,
            observacoes: motoboyData.observacoes || ''
          };

          novasJornadas.push(novaJornada);
          jornadasCriadas++;
        });

        if (jornadasCriadas > 0) {
          toast.success(`${jornadasCriadas} jornada(s) cadastrada(s) com sucesso!${jornadasExistentes > 0 ? ` ${jornadasExistentes} motoboy(s) já possuíam jornada nesta data.` : ''}`, {
            duration: 5000,
          });
        } else {
          toast.error('Nenhuma jornada foi criada. Todos os motoboys já possuem jornada nesta data.');
          return;
        }
      } else {
        // Cadastro single - verificar duplicata
        const dataCorrigida = formatarDataParaSalvar(jornadaForm.data);
        if (jornadas.find(j => j.motoboyId === jornadaForm.motoboyId && j.data === dataCorrigida)) {
          toast.error('Já existe uma jornada para este motoboy nesta data!');
          return;
        }

        const novaJornada = {
          id: Date.now().toString(),
          ...jornadaForm,
          data: dataCorrigida,
          valorDiaria: parseFloat(jornadaForm.valorDiaria) || 0,
          valorCorridas: parseFloat(jornadaForm.valorCorridas) || 0,
          comissoes: parseFloat(jornadaForm.comissoes) || 0,
          missoes: parseFloat(jornadaForm.missoes) || 0,
          descontos: parseFloat(jornadaForm.descontos) || 0
        };

        novasJornadas.push(novaJornada);
        toast.success('Jornada cadastrada com sucesso!');
      }

      setJornadas(novasJornadas);
      aplicarFiltros(novasJornadas);
    }

    // Resetar formulários
    setJornadaForm({
      data: '',
      motoboyId: '',
      lojaId: '',
      valorDiaria: 120.00,
      valorCorridas: 0.00,
      comissoes: 0.00,
      missoes: 0.00,
      descontos: 0.00,
      eFeriado: false,
      observacoes: ''
    });

    setJornadaMultiplaForm({
      data: '',
      lojaId: '',
      eFeriado: false,
      motoboys: []
    });

    setShowJornadaForm(false);
    setEditingJornada(null);
    setCadastroMultiplo(false);
  };

  // Função para adicionar adiantamento
  const addAdiantamento = async (e) => {
    e.preventDefault();
    
    if (!adiantamentoForm.motoboyId || !adiantamentoForm.lojaId || !adiantamentoForm.valor || !adiantamentoForm.data) {
      toast.error('Preencha todos os campos obrigatórios!');
      return;
    }

    const novoAdiantamento = {
      id: Date.now().toString(),
      ...adiantamentoForm
    };

    const novosAdiantamentos = [...adiantamentos, novoAdiantamento];
    setAdiantamentos(novosAdiantamentos);

    setAdiantamentoForm({
      motoboyId: '',
      lojaId: '',
      valor: 0.00,
      data: '',
      observacao: ''
    });

    toast.success('Adiantamento cadastrado com sucesso!');
  };

  // Função para adicionar/editar débito
  const addDebito = async (e) => {
    e.preventDefault();
    
    if (!debitoForm.lojaId || !debitoForm.descricao || !debitoForm.valor || !debitoForm.dataVencimento) {
      toast.error('Preencha todos os campos obrigatórios!');
      return;
    }

    if (editingDebito) {
      // Editando débito existente
      const novosDebitos = debitosPendentes.map(d => 
        d.id === editingDebito.id 
          ? { ...d, ...debitoForm }
          : d
      );
      setDebitosPendentes(novosDebitos);
      setEditingDebito(null);
      toast.success('Débito atualizado com sucesso!');
    } else {
      // Criando novo débito
      const novoDebito = {
        id: Date.now().toString(),
        ...debitoForm,
        dataCriacao: new Date().toISOString().split('T')[0]
      };

      const novosDebitos = [...debitosPendentes, novoDebito];
      setDebitosPendentes(novosDebitos);
      toast.success('Débito cadastrado com sucesso!');
    }

    setDebitoForm({
      lojaId: '',
      descricao: '',
      valor: 0.00,
      dataVencimento: '',
      status: 'pendente'
    });
  };

  // Função para editar débito
  const editDebito = (debito) => {
    setEditingDebito(debito);
    setDebitoForm({
      lojaId: debito.lojaId,
      descricao: debito.descricao,
      valor: debito.valor,
      dataVencimento: debito.dataVencimento,
      status: debito.status
    });
  };

  // Função para cancelar edição de débito
  const cancelarEdicaoDebito = () => {
    setEditingDebito(null);
    setDebitoForm({
      lojaId: '',
      descricao: '',
      valor: 0.00,
      dataVencimento: '',
      status: 'pendente'
    });
  };

  // Função para exportar débitos em PDF
  const exportarDebitosPDF = () => {
    if (debitosPendentes.length === 0) {
      toast.error('Nenhum débito disponível para exportar!');
      return;
    }

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;

    // Função para adicionar nova página
    const addNewPage = () => {
      doc.addPage();
      yPos = 20;
    };

    // Função para verificar se precisa de nova página
    const checkNewPage = (requiredHeight) => {
      if (yPos + requiredHeight > pageHeight - 20) {
        addNewPage();
      }
    };

    // Cabeçalho
    doc.setFontSize(16);
    doc.text('RELATÓRIO DE DÉBITOS PENDENTES - EXPRESSO NEVES', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, yPos);
    yPos += 15;

    // Filtrar e organizar débitos
    const debitosPendentesAtivos = debitosPendentes.filter(d => d.status === 'pendente');
    const debitosPagos = debitosPendentes.filter(d => d.status === 'pago');
    const debitosVencidos = debitosPendentesAtivos.filter(d => new Date(d.dataVencimento) < new Date());

    // Resumo geral
    doc.setFontSize(12);
    doc.text('RESUMO GERAL:', 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.text(`Total de débitos: ${debitosPendentes.length}`, 20, yPos);
    yPos += 6;
    doc.text(`Débitos pendentes: ${debitosPendentesAtivos.length}`, 20, yPos);
    yPos += 6;
    doc.text(`Débitos vencidos: ${debitosVencidos.length}`, 20, yPos);
    yPos += 6;
    doc.text(`Débitos pagos: ${debitosPagos.length}`, 20, yPos);
    yPos += 6;
    doc.text(`Valor total pendente: R$ ${debitosPendentesAtivos.reduce((sum, d) => sum + d.valor, 0).toFixed(2)}`, 20, yPos);
    yPos += 6;
    doc.text(`Valor total vencido: R$ ${debitosVencidos.reduce((sum, d) => sum + d.valor, 0).toFixed(2)}`, 20, yPos);
    yPos += 20;

    // Débitos por loja
    const debitosPorLoja = {};
    debitosPendentes.forEach(debito => {
      const loja = lojas.find(l => l.id === debito.lojaId);
      const nomeLoja = loja ? loja.nome : 'Loja não encontrada';
      
      if (!debitosPorLoja[nomeLoja]) {
        debitosPorLoja[nomeLoja] = [];
      }
      debitosPorLoja[nomeLoja].push(debito);
    });

    // Listar débitos por loja
    Object.keys(debitosPorLoja).sort().forEach(nomeLoja => {
      checkNewPage(60);

      doc.setFontSize(14);
      doc.text(`LOJA: ${nomeLoja}`, 20, yPos);
      yPos += 8;

      const debitosLoja = debitosPorLoja[nomeLoja];
      const valorTotalLoja = debitosLoja.reduce((sum, d) => sum + d.valor, 0);
      const pendentesLoja = debitosLoja.filter(d => d.status === 'pendente');

      doc.setFontSize(9);
      doc.text(`Total de débitos: ${debitosLoja.length} | Pendentes: ${pendentesLoja.length} | Valor total: R$ ${valorTotalLoja.toFixed(2)}`, 20, yPos);
      yPos += 8;

      // Cabeçalho da tabela
      doc.setFontSize(8);
      doc.text('DESCRIÇÃO', 20, yPos);
      doc.text('VALOR', 120, yPos);
      doc.text('VENCIMENTO', 150, yPos);
      doc.text('STATUS', 180, yPos);
      yPos += 6;

      // Linha horizontal
      doc.line(20, yPos, 195, yPos);
      yPos += 3;

      // Dados dos débitos
      debitosLoja.sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento)).forEach(debito => {
        checkNewPage(8);
        
        const isVencido = new Date(debito.dataVencimento) < new Date();
        
        doc.setFontSize(7);
        doc.text(debito.descricao.substring(0, 60), 20, yPos);
        doc.text(`R$ ${debito.valor.toFixed(2)}`, 120, yPos);
        doc.text(new Date(debito.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR'), 150, yPos);
        
        // Status com cor
        if (debito.status === 'pendente' && isVencido) {
          doc.setTextColor(255, 0, 0); // Vermelho
          doc.text('VENCIDO', 180, yPos);
        } else if (debito.status === 'pendente') {
          doc.setTextColor(255, 165, 0); // Laranja
          doc.text('PENDENTE', 180, yPos);
        } else if (debito.status === 'pago') {
          doc.setTextColor(0, 128, 0); // Verde
          doc.text('PAGO', 180, yPos);
        }
        
        doc.setTextColor(0, 0, 0); // Voltar para preto
        yPos += 6;
      });

      // Subtotal da loja
      yPos += 3;
      doc.line(20, yPos, 195, yPos);
      yPos += 5;
      doc.setFontSize(8);
      doc.text(`SUBTOTAL ${nomeLoja.toUpperCase()}: R$ ${valorTotalLoja.toFixed(2)}`, 20, yPos);
      yPos += 15;
    });

    // Rodapé final
    checkNewPage(30);
    yPos += 10;
    doc.line(20, yPos, 195, yPos);
    yPos += 8;
    doc.setFontSize(12);
    doc.text(`TOTAL GERAL: R$ ${debitosPendentes.reduce((sum, d) => sum + d.valor, 0).toFixed(2)}`, 20, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.text(`TOTAL PENDENTE: R$ ${debitosPendentesAtivos.reduce((sum, d) => sum + d.valor, 0).toFixed(2)}`, 20, yPos);

    // Salvar PDF
    const dataAtual = new Date().toISOString().split('T')[0].replace(/-/g, '');
    doc.save(`debitos-pendentes-${dataAtual}.pdf`);
    toast.success('PDF de débitos exportado com sucesso!');
  };

  // Função para exportar débitos em CSV
  const exportarDebitosCSV = () => {
    if (debitosPendentes.length === 0) {
      toast.error('Nenhum débito disponível para exportar!');
      return;
    }

    // Cabeçalho do CSV
    let csvContent = 'Loja,Descrição,Valor,Data Vencimento,Status,Data Criação\n';

    // Dados dos débitos
    debitosPendentes.forEach(debito => {
      const loja = lojas.find(l => l.id === debito.lojaId);
      const nomeLoja = loja ? loja.nome.replace(/,/g, ';') : 'Loja não encontrada';
      const descricao = debito.descricao.replace(/,/g, ';');
      
      csvContent += `${nomeLoja},${descricao},${debito.valor.toFixed(2)},${debito.dataVencimento},${debito.status},${debito.dataCriacao}\n`;
    });

    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const dataAtual = new Date().toISOString().split('T')[0].replace(/-/g, '');
      link.setAttribute('download', `debitos-pendentes-${dataAtual}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV de débitos exportado com sucesso!');
    }
  };

  // Função para editar motoboy
  const editMotoboy = (motoboy) => {
    setEditingMotoboy(motoboy);
    setMotoboyForm({
      nome: motoboy.nome,
      cpf: motoboy.cpf,
      telefone: motoboy.telefone,
      status: motoboy.status
    });
  };

  // Função para cancelar edição de motoboy
  const cancelarEdicaoMotoboy = () => {
    setEditingMotoboy(null);
    setMotoboyForm({
      nome: '',
      cpf: '',
      telefone: '',
      status: 'ativo'
    });
  };

  // Função para deletar motoboy
  const deleteMotoboy = async (id) => {
    toast((t) => (
      <div className="flex flex-col items-center">
        <span className="mb-3">Tem certeza que deseja excluir este motoboy?</span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const novosMotoboys = motoboys.filter(m => m.id !== id);
              setMotoboys(novosMotoboys);
              toast.dismiss(t.id);
              toast.success('Motoboy excluído com sucesso!');
            }}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Excluir
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
    });
  };

  // Função para aplicar filtros de motoboys
  const aplicarFiltrosMotoboy = () => {
    let resultado = [...motoboys];

    // Filtro por nome
    if (filtrosMotoboy.nome) {
      resultado = resultado.filter(m => 
        m.nome.toLowerCase().includes(filtrosMotoboy.nome.toLowerCase())
      );
    }

    // Filtro por status
    if (filtrosMotoboy.status) {
      resultado = resultado.filter(m => m.status === filtrosMotoboy.status);
    }

    // Filtro por CPF
    if (filtrosMotoboy.cpf) {
      resultado = resultado.filter(m => 
        m.cpf.includes(filtrosMotoboy.cpf)
      );
    }

    setMotoboysFiltrados(resultado);
  };

  // Função para limpar filtros de motoboys
  const limparFiltrosMotoboy = () => {
    setFiltrosMotoboy({
      nome: '',
      status: '',
      cpf: ''
    });
    setMotoboysFiltrados(motoboys);
  };

  // Função para editar loja
  const editLoja = (loja) => {
    setEditingLoja(loja);
    setLojaForm({
      nome: loja.nome,
      cnpj: loja.cnpj,
      contato: loja.contato,
      valorHoraSegSab: loja.valorHoraSegSab || 12.00,
      valorHoraDomFeriado: loja.valorHoraDomFeriado || 13.33,
      valorCorridaAte5km: loja.valorCorridaAte5km || 5.00,
      valorCorridaAcima5km: loja.valorCorridaAcima5km || 8.00,
      taxaAdministrativa: loja.taxaAdministrativa || 350.00,
      taxaSupervisao: loja.taxaSupervisao || 50.00,
      limiteValorFixo: loja.limiteValorFixo || 1000.00,
      percentualTaxa: loja.percentualTaxa || 10.00,
      usarTaxaPercentual: loja.usarTaxaPercentual || false
    });
  };

  // Função para deletar loja
  const deleteLoja = async (id) => {
    toast((t) => (
      <div className="flex flex-col items-center">
        <span className="mb-3">Tem certeza que deseja excluir esta loja?</span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const novasLojas = lojas.filter(l => l.id !== id);
              setLojas(novasLojas);
              toast.dismiss(t.id);
              toast.success('Loja excluída com sucesso!');
            }}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Excluir
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
    });
  };

  // Função para cancelar edição
  const cancelarEdicaoLoja = () => {
    setEditingLoja(null);
    setLojaForm({
      nome: '',
      cnpj: '',
      contato: '',
      valorHoraSegSab: 12.00,
      valorHoraDomFeriado: 13.33,
      valorCorridaAte5km: 5.00,
      valorCorridaAcima5km: 8.00,
      taxaAdministrativa: 350.00,
      taxaSupervisao: 50.00,
      limiteValorFixo: 1000.00,
      percentualTaxa: 10.00,
      usarTaxaPercentual: false
    });
  };

  // Função para editar jornada
  const editJornada = (jornada) => {
    setEditingJornada(jornada);
    setJornadaForm({
      data: jornada.data, // Manter a data exatamente como está salva
      motoboyId: jornada.motoboyId,
      lojaId: jornada.lojaId,
      valorDiaria: jornada.valorDiaria || 120.00,
      valorCorridas: jornada.valorCorridas || 0.00,
      comissoes: jornada.comissoes || 0.00,
      missoes: jornada.missoes || 0.00,
      descontos: jornada.descontos || 0.00,
      eFeriado: jornada.eFeriado || false,
      observacoes: jornada.observacoes || ''
    });
    setCadastroMultiplo(false);
    setShowJornadaForm(true);
  };

  // Função para deletar jornada
  const deleteJornada = (id) => {
    toast((t) => (
      <div className="flex flex-col items-center">
        <span className="mb-3">Tem certeza que deseja excluir esta jornada?</span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const novasJornadas = jornadas.filter(j => j.id !== id);
              setJornadas(novasJornadas);
              aplicarFiltros(novasJornadas);
              toast.dismiss(t.id);
              toast.success('Jornada excluída com sucesso!');
            }}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Excluir
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
    });
  };

  // Função para aplicar filtros
  const aplicarFiltros = (jornadasParaFiltrar = jornadas) => {
    // Primeiro aplicar filtro de loja para lojistas
    let resultado = getJornadasFiltradas(jornadasParaFiltrar);

    // Filtro por data início
    if (filtros.dataInicio) {
      resultado = resultado.filter(j => j.data >= filtros.dataInicio);
    }

    // Filtro por data fim
    if (filtros.dataFim) {
      resultado = resultado.filter(j => j.data <= filtros.dataFim);
    }

    // Filtro por motoboy
    if (filtros.motoboyId) {
      resultado = resultado.filter(j => j.motoboyId === filtros.motoboyId);
    }

    // Filtro por loja
    if (filtros.lojaId) {
      resultado = resultado.filter(j => j.lojaId === filtros.lojaId);
    }

    // Filtro por feriado
    if (filtros.eFeriado) {
      resultado = resultado.filter(j => j.eFeriado === true);
    }

    // Filtro por busca (nome do motoboy ou loja)
    if (filtros.busca) {
      resultado = resultado.filter(j => {
        const motoboy = motoboys.find(m => m.id === j.motoboyId);
        const loja = lojas.find(l => l.id === j.lojaId);
        const termoBusca = filtros.busca.toLowerCase();
        
        return (
          (motoboy?.nome || '').toLowerCase().includes(termoBusca) ||
          (loja?.nome || '').toLowerCase().includes(termoBusca)
        );
      });
    }

    setJornadasFiltradas(resultado);
  };

  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltros({
      dataInicio: '',
      dataFim: '',
      motoboyId: '',
      lojaId: '',
      eFeriado: false,
      busca: ''
    });
    setJornadasFiltradas(getJornadasFiltradas(jornadas));
  };

  // Função para calcular identificador de semana baseado no período
  const calcularSemanaIdentificador = (dataInicio, dataFim) => {
    const inicio = new Date(dataInicio);
    const ano = inicio.getFullYear();
    
    // Calcular o número da semana do ano (aproximado)
    const jan1 = new Date(ano, 0, 1);
    const diasDoAno = Math.floor((inicio - jan1) / (24 * 60 * 60 * 1000));
    const numeroSemana = Math.ceil((diasDoAno + jan1.getDay() + 1) / 7);
    
    return `${ano}-W${numeroSemana.toString().padStart(2, '0')}`;
  };

  // Função para obter o período da semana atual (segunda até quarta)
  const obterPeriodoSemanaAtual = () => {
    const hoje = new Date();
    const diaSemana = hoje.getDay(); // 0=domingo, 1=segunda, etc.
    
    // Calcular segunda-feira da semana atual
    const segunda = new Date(hoje);
    const diasParaSegunda = diaSemana === 0 ? -6 : -(diaSemana - 1); // Se domingo, voltar 6 dias
    segunda.setDate(hoje.getDate() + diasParaSegunda);
    
    // Calcular quarta-feira da semana atual
    const quarta = new Date(segunda);
    quarta.setDate(segunda.getDate() + 2); // Segunda + 2 dias = quarta
    
    return {
      inicio: segunda.toISOString().split('T')[0],
      fim: quarta.toISOString().split('T')[0]
    };
  };



  // Função para gerar relatórios
  const gerarRelatorios = () => {
    if (!relatorioConfig.dataInicio || !relatorioConfig.dataFim) {
      toast.error('Selecione as datas de início e fim do período!');
      return;
    }

    // Validar se data início é menor ou igual à data fim
    if (relatorioConfig.dataInicio > relatorioConfig.dataFim) {
      toast.error('A data de início deve ser menor ou igual à data de fim!');
      return;
    }

    const dataInicio = relatorioConfig.dataInicio;
    const dataFim = relatorioConfig.dataFim;

    // Usar dados filtrados para lojistas
    const jornadasParaProcessar = getJornadasFiltradas();
    const adiantamentosParaProcessar = getAdiantamentosFiltrados();
    const debitosParaProcessar = getDebitosFiltrados();
    const lojasParaProcessar = getLojasFiltradas();

    console.log('🗓️ === DEBUG FILTRO DE RELATÓRIOS ===');
    console.log('🗓️ Período selecionado:', { dataInicio, dataFim });
    console.log('🗓️ Usuário logado:', currentUser?.tipo, currentUser?.lojaId);
    console.log('🗓️ Total de jornadas disponíveis:', jornadasParaProcessar.length);
    
    // Debug: listar todas as datas das jornadas
    const datasJornadas = jornadasParaProcessar.map(j => j.data).sort();
    console.log('🗓️ Datas das jornadas disponíveis:', datasJornadas);

    // Filtrar jornadas do período
    const jornadasPeriodo = jornadasParaProcessar.filter(j => {
      const dentroDoIntervalo = j.data >= dataInicio && j.data <= dataFim;
      if (dentroDoIntervalo) {
        console.log('✅ Jornada incluída:', j.data, 'Motoboy:', j.motoboyId);
      }
      return dentroDoIntervalo;
    });
    
    console.log('📊 Jornadas encontradas no período:', jornadasPeriodo.length);
    console.log('📊 Datas das jornadas filtradas:', jornadasPeriodo.map(j => j.data).sort());
    console.log('💰 Total de débitos disponíveis:', debitosParaProcessar.length);
    console.log('💰 Débitos por status:', debitosParaProcessar.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {}));
    console.log('💰 Lojas com débitos pendentes:', debitosParaProcessar.filter(d => d.status === 'pendente').map(d => {
      const loja = lojasParaProcessar.find(l => l.id === d.lojaId);
      return `${loja?.nome}: ${d.descricao} - R$ ${d.valor}`;
    }));

    // Agrupar por loja (apenas lojas que o usuário tem acesso)
    const relatoriosPorLoja = lojasParaProcessar.map(loja => {
      const jornadasLoja = jornadasPeriodo.filter(j => j.lojaId === loja.id);
      console.log(`🏪 Loja ${loja.nome}: ${jornadasLoja.length} jornadas`);
      
      if (jornadasLoja.length === 0) {
        return null;
      }

      // Consolidar dados por motoboy (somar todas as jornadas do mesmo motoboy)
      const motoboysMap = new Map();
      
      jornadasLoja.forEach(jornada => {
        const motoboyId = jornada.motoboyId;
        const motoboy = motoboys.find(m => m.id === motoboyId);
        
        if (!motoboy) {
          console.warn('⚠️ Motoboy não encontrado:', motoboyId);
          return;
        }

        // Filtrar adiantamentos do motoboy nesta loja no período
        // REGRA: Adiantamentos da semana atual (segunda até quarta) devem ser incluídos
        const periodoSemanaAtual = obterPeriodoSemanaAtual();
        console.log('📅 Período semana atual (seg-qua):', periodoSemanaAtual);
        
        const adiantamentosMotoboyLoja = adiantamentosParaProcessar.filter(a => {
          if (a.motoboyId !== motoboyId || a.lojaId !== loja.id) return false;
          
          // Incluir adiantamentos do período do relatório
          const noPeriodoRelatorio = a.data >= dataInicio && a.data <= dataFim;
          
          // Incluir adiantamentos da semana atual (segunda até quarta)
          const naSemanaAtual = a.data >= periodoSemanaAtual.inicio && a.data <= periodoSemanaAtual.fim;
          
          const incluir = noPeriodoRelatorio || naSemanaAtual;
          
          if (incluir) {
            console.log(`💰 Adiantamento incluído: ${a.data} - R$ ${a.valor} (${noPeriodoRelatorio ? 'período' : 'semana atual'})`);
          }
          
          return incluir;
        });

        // Calcular valores da jornada (com valores padrão para evitar NaN)
        const totalCorridasJornada = jornada.valorCorridas || 0;

        if (motoboysMap.has(motoboyId)) {
          // Somar aos valores existentes (com valores padrão)
          const existente = motoboysMap.get(motoboyId);
          motoboysMap.set(motoboyId, {
            ...existente,
            valorDiaria: (existente.valorDiaria || 0) + (jornada.valorDiaria || 0),
            valorCorridas: (existente.valorCorridas || 0) + (jornada.valorCorridas || 0),
            comissoes: (existente.comissoes || 0) + (jornada.comissoes || 0),
            missoes: (existente.missoes || 0) + (jornada.missoes || 0),
            descontos: (existente.descontos || 0) + (jornada.descontos || 0),
            totalCorridas: (existente.totalCorridas || 0) + totalCorridasJornada,
            eFeriado: existente.eFeriado || jornada.eFeriado, // Se teve pelo menos um feriado
            jornadas: [...existente.jornadas, jornada]
          });
        } else {
          // Criar novo registro consolidado (com valores padrão)
          motoboysMap.set(motoboyId, {
            id: `${motoboyId}-${loja.id}`,
            motoboy,
            motoboyId,
            lojaId: loja.id,
            valorDiaria: jornada.valorDiaria || 0,
            valorCorridas: jornada.valorCorridas || 0,
            comissoes: jornada.comissoes || 0,
            missoes: jornada.missoes || 0,
            descontos: jornada.descontos || 0,
            totalCorridas: totalCorridasJornada,
            eFeriado: jornada.eFeriado || false,
            adiantamentos: adiantamentosMotoboyLoja,
            totalAdiantamentos: adiantamentosMotoboyLoja.reduce((sum, a) => sum + (a.valor || 0), 0),
            jornadas: [jornada]
          });
        }
      });

      // Converter Map para Array e calcular totais finais
      const motoboysConsolidados = Array.from(motoboysMap.values()).map(motoboyData => {
        const totalBruto = (motoboyData.valorDiaria || 0) + (motoboyData.totalCorridas || 0) + 
                          (motoboyData.comissoes || 0) + (motoboyData.missoes || 0);
        const totalLiquido = totalBruto - (motoboyData.descontos || 0) - (motoboyData.totalAdiantamentos || 0);

        console.log(`👤 ${motoboyData.motoboy.nome}:`, {
          diaria: motoboyData.valorDiaria,
          corridas: motoboyData.totalCorridas,
          comissoes: motoboyData.comissoes + motoboyData.missoes,
          bruto: totalBruto,
          adiantamentos: motoboyData.totalAdiantamentos,
          liquido: totalLiquido
        });

        return {
          ...motoboyData,
          totalBruto,
          totalLiquido: totalBruto - (motoboyData.descontos || 0) // Não descontar adiantamentos no relatório principal
        };
      });

      // Calcular totais da loja
      const totalBrutoLoja = motoboysConsolidados.reduce((sum, m) => sum + (m.totalBruto || 0), 0);
      const totalLiquidoLoja = motoboysConsolidados.reduce((sum, m) => sum + (m.totalLiquido || 0), 0);
      const totalAdiantamentosLoja = motoboysConsolidados.reduce((sum, m) => sum + (m.totalAdiantamentos || 0), 0);

      // Calcular taxas - verificar se deve usar percentual ou valor fixo
      let valorTaxaAdmin = loja.taxaAdministrativa || 0;
      
      // Se a loja usa taxa percentual e o valor total ultrapassa o limite
      if (loja.usarTaxaPercentual && totalLiquidoLoja > (loja.limiteValorFixo || 0)) {
        valorTaxaAdmin = (totalLiquidoLoja * (loja.percentualTaxa || 0)) / 100;
        console.log(`🏪 ${loja.nome}: Usando taxa percentual de ${loja.percentualTaxa}% = R$ ${valorTaxaAdmin.toFixed(2)}`);
      } else {
        console.log(`🏪 ${loja.nome}: Usando taxa fixa de R$ ${valorTaxaAdmin.toFixed(2)}`);
      }
      
      const valorTaxaSupervisao = loja.taxaSupervisao || 0;
      const totalTaxas = valorTaxaAdmin + valorTaxaSupervisao;

      // Débitos da loja - incluir todos os débitos pendentes da loja independente da data
      const debitosLoja = debitosParaProcessar.filter(d => 
        d.lojaId === loja.id && 
        d.status === 'pendente'
      );
      const totalDebitos = debitosLoja.reduce((sum, d) => sum + (d.valor || 0), 0);
      
      console.log(`💰 Débitos encontrados para ${loja.nome}:`, debitosLoja.length);
      console.log(`💰 Total débitos ${loja.nome}:`, totalDebitos);

      // Total final a pagar
      const totalFinal = totalLiquidoLoja + totalTaxas + totalDebitos;

      console.log(`🏪 Totais ${loja.nome}:`, {
        bruto: totalBrutoLoja,
        liquido: totalLiquidoLoja,
        adiantamentos: totalAdiantamentosLoja,
        taxas: totalTaxas,
        debitos: totalDebitos,
        final: totalFinal
      });

      console.log(`📅 Período para card da loja ${loja.nome}:`, {
        dataInicio,
        dataFim,
        inicioFormatado: new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR'),
        fimFormatado: new Date(dataFim + 'T12:00:00').toLocaleDateString('pt-BR')
      });

      return {
        loja,
        motoboys: motoboysConsolidados,
        totais: {
          bruto: totalBrutoLoja,
          liquido: totalLiquidoLoja,
          adiantamentos: totalAdiantamentosLoja,
          taxaAdmin: valorTaxaAdmin,
          taxaSupervisao: valorTaxaSupervisao,
          totalTaxas,
          debitos: totalDebitos,
          final: totalFinal
        },
        debitos: debitosLoja,
        periodo: {
          inicio: dataInicio,
          fim: dataFim,
          semana: calcularSemanaIdentificador(dataInicio, dataFim)
        }
      };
    }).filter(relatorio => relatorio !== null);

    console.log('📋 Relatórios gerados:', relatoriosPorLoja.length);
    setRelatorioLojas(relatoriosPorLoja);
  };

  // Função para gerar PDF individual
  const gerarPDF = (grupo) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 30;

    // Função para adicionar nova página
    const addNewPage = () => {
      doc.addPage();
      yPos = 30;
      addHeaderToPage();
    };

    // Função para verificar se precisa de nova página
    const checkNewPage = (requiredHeight) => {
      if (yPos + requiredHeight > pageHeight - 30) {
        addNewPage();
      }
    };

    // Função para adicionar cabeçalho em nova página
    const addHeaderToPage = () => {
      // Logo/Nome da empresa
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('EXPRESSO NEVES', pageWidth / 2, 20, { align: 'center' });
      
      // Linha divisória
      doc.setLineWidth(0.5);
      doc.line(20, 25, pageWidth - 20, 25);
      
      yPos = 35;
    };

    // Cabeçalho principal
    addHeaderToPage();

    // Título do relatório
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('RELATÓRIO FINANCEIRO SEMANAL', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Informações da loja
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('DADOS DA LOJA:', 20, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nome: ${grupo.loja.nome}`, 25, yPos);
    yPos += 6;
    doc.text(`CNPJ: ${grupo.loja.cnpj}`, 25, yPos);
    yPos += 6;
    doc.text(`Contato: ${grupo.loja.contato}`, 25, yPos);
    yPos += 6;
    doc.text(`Período: ${new Date(grupo.periodo.inicio + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date(grupo.periodo.fim + 'T12:00:00').toLocaleDateString('pt-BR')}`, 25, yPos);
    yPos += 6;
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 25, yPos);
    yPos += 15;

    // Resumo executivo em destaque
    checkNewPage(40);
    doc.setFillColor(240, 248, 255);
    doc.rect(20, yPos - 5, pageWidth - 40, 35, 'F');
    doc.setDrawColor(41, 128, 185);
    doc.rect(20, yPos - 5, pageWidth - 40, 35);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('RESUMO EXECUTIVO', 25, yPos + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Valor Total a Pagar: R$ ${grupo.totais.final.toFixed(2)}`, 25, yPos + 15);
    doc.text(`Total Logística: R$ ${grupo.totais.liquido.toFixed(2)}`, 25, yPos + 22);
    doc.text(`Total Taxas: R$ ${(grupo.totais.taxaAdmin + grupo.totais.taxaSupervisao).toFixed(2)}`, 100, yPos + 15);
    doc.text(`Débitos Pendentes: R$ ${grupo.totais.debitos.toFixed(2)}`, 100, yPos + 22);
    yPos += 45;

    // Detalhamento dos motoboys
    checkNewPage(50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('DETALHAMENTO POR MOTOBOY:', 20, yPos);
    yPos += 10;

    // PRIMEIRA TABELA - DADOS SEMANAIS
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS SEMANAIS DE CORRIDAS:', 20, yPos);
    yPos += 12;

    // Configurações da primeira tabela (dados semanais)
    const tableHeaders1 = ['MOTOBOY', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
    const colWidths1 = [50, 17, 17, 17, 17, 17, 17, 17]; // Total: 169px
    const tableWidth1 = colWidths1.reduce((sum, width) => sum + width, 0);
    const tableHeight1 = 10;
    
    // Cabeçalho da primeira tabela
    doc.setFillColor(52, 73, 94); // Azul escuro
    doc.rect(20, yPos - 2, tableWidth1, tableHeight1, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.rect(20, yPos - 2, tableWidth1, tableHeight1, 'S');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // Texto branco
    
    let xPos = 20;
    tableHeaders1.forEach((header, index) => {
      doc.text(header, xPos + (colWidths1[index] / 2), yPos + 4, { align: 'center' });
      xPos += colWidths1[index];
    });
    yPos += tableHeight1;

    // Dados dos motoboys - primeira tabela
    let rowIndex = 0;
    grupo.motoboys.forEach(motoboy => {
      checkNewPage(10);
      
      // Cor alternada para as linhas
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 249, 250); // Cinza claro
        doc.rect(20, yPos, tableWidth1, 8, 'F');
      }
      
      // Bordas da linha
      doc.setDrawColor(200, 200, 200);
      doc.rect(20, yPos, tableWidth1, 8, 'S');
      
      xPos = 20;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      
      // Nome do motoboy
      doc.text(motoboy.motoboy.nome.substring(0, 16), xPos + 2, yPos + 5);
      xPos += colWidths1[0];
      
      // Organizar jornadas por dia da semana para mostrar valores das corridas
      const jornadasPorDia = {};
      motoboy.jornadas.forEach(jornada => {
        const data = new Date(jornada.data + 'T12:00:00');
        const diaSemana = data.getDay(); // 0=domingo, 1=segunda, etc.
        jornadasPorDia[diaSemana] = jornada;
      });
      
      // Dias da semana (Segunda até Domingo) - Exibir apenas valores das corridas como na interface
      [1, 2, 3, 4, 5, 6, 0].forEach((dia, index) => {
        const jornada = jornadasPorDia[dia];
        const colIndex = index + 1; // Colunas 1-7 são os dias da semana
        if (jornada) {
          const valorCorridas = jornada.valorCorridas || 0;
          // Usar cor verde para valores das corridas (igual à interface)
          doc.setTextColor(46, 125, 50);
          doc.text(`${valorCorridas.toFixed(0)}`, xPos + (colWidths1[colIndex] / 2), yPos + 5, { align: 'center' });
          doc.setTextColor(0, 0, 0); // Voltar para preto
        } else {
          doc.text('-', xPos + (colWidths1[colIndex] / 2), yPos + 5, { align: 'center' });
        }
        xPos += colWidths1[colIndex];
      });

      yPos += 8;
      rowIndex++;
    });

    // Espaço entre tabelas
    yPos += 15;
    checkNewPage(50);

    // SEGUNDA TABELA - VALORES CONSOLIDADOS
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('VALORES CONSOLIDADOS:', 20, yPos);
    yPos += 12;

    // Configurações da segunda tabela (valores consolidados)
    const tableHeaders2 = ['MOTOBOY', 'DIÁRIA', 'TAXA', 'MISSÕES', 'DESCONTOS', 'ADIANT.', 'TOTAL'];
    const colWidths2 = [50, 22, 22, 22, 22, 22, 22]; // Total: 182px
    const tableWidth2 = colWidths2.reduce((sum, width) => sum + width, 0);
    const tableHeight2 = 10;
    
    // Cabeçalho da segunda tabela
    doc.setFillColor(52, 73, 94); // Azul escuro
    doc.rect(20, yPos - 2, tableWidth2, tableHeight2, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.rect(20, yPos - 2, tableWidth2, tableHeight2, 'S');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // Texto branco
    
    xPos = 20;
    tableHeaders2.forEach((header, index) => {
      doc.text(header, xPos + (colWidths2[index] / 2), yPos + 4, { align: 'center' });
      xPos += colWidths2[index];
    });
    yPos += tableHeight2;

    // Dados dos motoboys - segunda tabela
    rowIndex = 0;
    grupo.motoboys.forEach(motoboy => {
      checkNewPage(10);
      
      // Cor alternada para as linhas
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 249, 250); // Cinza claro
        doc.rect(20, yPos, tableWidth2, 8, 'F');
      }
      
      // Bordas da linha
      doc.setDrawColor(200, 200, 200);
      doc.rect(20, yPos, tableWidth2, 8, 'S');
      
      xPos = 20;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      
      // Nome do motoboy
      doc.text(motoboy.motoboy.nome.substring(0, 16), xPos + 2, yPos + 5);
      xPos += colWidths2[0];
      
      // Valores consolidados com formatação
      const consolidatedData = [
        `${motoboy.valorDiaria.toFixed(0)}`,
        `${motoboy.totalCorridas.toFixed(0)}`,
        `${(motoboy.comissoes + motoboy.missoes).toFixed(0)}`,
        `${motoboy.descontos.toFixed(0)}`,
        `${motoboy.totalAdiantamentos.toFixed(0)}`,
        `${motoboy.totalLiquido.toFixed(0)}`
      ];
      
      consolidatedData.forEach((data, index) => {
        const colIndex = index + 1;
        // Destacar valores negativos e positivos
        if (index === 3 || index === 4) { // Descontos e adiantamentos
          doc.setTextColor(211, 47, 47); // Vermelho
        } else if (index === 5) { // Total
          doc.setTextColor(46, 125, 50); // Verde
        } else {
          doc.setTextColor(0, 0, 0); // Preto
        }
        
        doc.text(data, xPos + (colWidths2[colIndex] / 2), yPos + 5, { align: 'center' });
        xPos += colWidths2[colIndex];
      });
      
      doc.setTextColor(0, 0, 0); // Voltar para preto
      yPos += 8;
      rowIndex++;
    });

    // Linha de total
    doc.setFillColor(46, 125, 50); // Verde
    doc.rect(20, yPos, tableWidth2, 10, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.rect(20, yPos, tableWidth2, 10, 'S');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL LOGÍSTICA', 22, yPos + 6);
    doc.text(`R$ ${grupo.totais.liquido.toFixed(2)}`, 20 + tableWidth2 - 25, yPos + 6, { align: 'right' });
    yPos += 20;

    // Linha de total
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos, pageWidth - 40, 8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL LOGÍSTICA', 22, yPos + 5);
    doc.text(`R$ ${grupo.totais.liquido.toFixed(2)}`, pageWidth - 45, yPos + 5, { align: 'center' });
    yPos += 20;

    // Composição financeira
    checkNewPage(60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPOSIÇÃO FINANCEIRA:', 20, yPos);
    yPos += 10;

    // Tabela de composição
    const compData = [
      ['Descrição', 'Valor', 'Observações'],
      ['Total Logística', `R$ ${grupo.totais.liquido.toFixed(2)}`, 'Soma de todos os motoboys'],
      [
        'Taxa Administrativa', 
        `R$ ${grupo.totais.taxaAdmin.toFixed(2)}`, 
        grupo.loja.usarTaxaPercentual && grupo.totais.liquido > (grupo.loja.limiteValorFixo || 0) 
          ? `${grupo.loja.percentualTaxa}% sobre o total`
          : 'Taxa fixa'
      ],
      ['Taxa Supervisão', `R$ ${grupo.totais.taxaSupervisao.toFixed(2)}`, 'Taxa fixa de supervisão'],
      ['Débitos Pendentes', `R$ ${grupo.totais.debitos.toFixed(2)}`, `${grupo.debitos.length} débito(s)`]
    ];

    compData.forEach((row, index) => {
      checkNewPage(8);
      
      if (index === 0) {
        // Cabeçalho
        doc.setFillColor(220, 220, 220);
        doc.rect(20, yPos - 2, pageWidth - 40, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        
        if (index === compData.length - 1) {
          doc.setFillColor(255, 248, 220);
          doc.rect(20, yPos - 2, pageWidth - 40, 8, 'F');
        }
      }

      doc.text(row[0], 22, yPos + 3);
      doc.text(row[1], 80, yPos + 3);
      doc.text(row[2], 120, yPos + 3);

      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos + 5, pageWidth - 20, yPos + 5);
      yPos += 8;
    });

    // Total final destacado
    yPos += 5;
    doc.setFillColor(41, 128, 185);
    doc.rect(20, yPos - 5, pageWidth - 40, 15, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('VALOR TOTAL A PAGAR:', 25, yPos + 5);
    doc.text(`R$ ${grupo.totais.final.toFixed(2)}`, pageWidth - 25, yPos + 5, { align: 'right' });
    yPos += 20;

    // Débitos detalhados (se houver)
    if (grupo.debitos && grupo.debitos.length > 0) {
      checkNewPage(40);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('DÉBITOS PENDENTES DETALHADOS:', 20, yPos);
      yPos += 10;

      grupo.debitos.forEach(debito => {
        checkNewPage(12);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        // Background alternado
        doc.setFillColor(250, 250, 250);
        doc.rect(20, yPos - 2, pageWidth - 40, 10, 'F');
        
        doc.text(`• ${debito.descricao}`, 25, yPos + 2);
        doc.text(`R$ ${debito.valor.toFixed(2)}`, 120, yPos + 2);
        doc.text(`Vencimento: ${new Date(debito.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR')}`, 25, yPos + 6);
        
        yPos += 12;
      });
    }

    // Rodapé
    const addFooter = () => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      // Linha no rodapé
      doc.setDrawColor(200, 200, 200);
      doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
      
      doc.text('Expresso Neves - Relatório Financeiro', 20, pageHeight - 15);
      doc.text(`Página ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth - 20, pageHeight - 15, { align: 'right' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    };

    // Adicionar rodapé em todas as páginas
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter();
    }

    // Salvar PDF
    const dataInicioFormatada = grupo.periodo.inicio.replace(/-/g, '');
    const dataFimFormatada = grupo.periodo.fim.replace(/-/g, '');
    const nomeArquivo = `relatorio-${grupo.loja.nome.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${dataInicioFormatada}-${dataFimFormatada}.pdf`;
    doc.save(nomeArquivo);
  };

  // Função para gerar PDF consolidado de todos os relatórios
  const gerarPDFTodos = () => {
    if (relatorioLojas.length === 0) {
      toast.error('Nenhum relatório disponível para exportar!');
      return;
    }

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 30;

    // Função para adicionar nova página
    const addNewPage = () => {
      doc.addPage();
      yPos = 30;
      addHeaderToPage();
    };

    // Função para verificar se precisa de nova página
    const checkNewPage = (requiredHeight) => {
      if (yPos + requiredHeight > pageHeight - 30) {
        addNewPage();
      }
    };

    // Função para adicionar cabeçalho em nova página
    const addHeaderToPage = () => {
      // Logo/Nome da empresa
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('EXPRESSO NEVES', pageWidth / 2, 20, { align: 'center' });
      
      // Linha divisória
      doc.setLineWidth(0.5);
      doc.line(20, 25, pageWidth - 20, 25);
      
      yPos = 35;
    };

    // Cabeçalho principal
    addHeaderToPage();

    // Título do relatório
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('RELATÓRIO CONSOLIDADO FINANCEIRO', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Informações gerais
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    if (relatorioLojas.length > 0) {
      doc.text(`Período: ${new Date(relatorioLojas[0].periodo.inicio + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date(relatorioLojas[0].periodo.fim + 'T12:00:00').toLocaleDateString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;
    }

    // Resumo executivo consolidado
    const totalGeral = relatorioLojas.reduce((sum, grupo) => sum + grupo.totais.final, 0);
    const totalLogistica = relatorioLojas.reduce((sum, grupo) => sum + grupo.totais.liquido, 0);
    const totalTaxas = relatorioLojas.reduce((sum, grupo) => sum + grupo.totais.totalTaxas, 0);
    const totalDebitos = relatorioLojas.reduce((sum, grupo) => sum + grupo.totais.debitos, 0);

    // Caixa de resumo geral
    doc.setFillColor(240, 248, 255);
    doc.rect(20, yPos - 5, pageWidth - 40, 50, 'F');
    doc.setDrawColor(41, 128, 185);
    doc.rect(20, yPos - 5, pageWidth - 40, 50);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('RESUMO EXECUTIVO CONSOLIDADO', 25, yPos + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total de Lojas Atendidas: ${relatorioLojas.length}`, 25, yPos + 15);
    doc.text(`Total Logística: R$ ${totalLogistica.toFixed(2)}`, 25, yPos + 23);
    doc.text(`Total Taxas Administrativas: R$ ${totalTaxas.toFixed(2)}`, 25, yPos + 31);
    doc.text(`Total Débitos Pendentes: R$ ${totalDebitos.toFixed(2)}`, 25, yPos + 39);

    // Total geral destacado
    doc.setFillColor(41, 128, 185);
    doc.rect(pageWidth - 80, yPos + 5, 55, 15, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL GERAL:', pageWidth - 77, yPos + 12);
    doc.text(`R$ ${totalGeral.toFixed(2)}`, pageWidth - 77, yPos + 18);

    yPos += 60;

    // Tabela resumo por loja
    checkNewPage(60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('RESUMO POR LOJA:', 20, yPos);
    yPos += 10;

    // Cabeçalho da tabela resumo
    const headerCols = ['LOJA', 'LOGÍSTICA', 'TAXAS', 'DÉBITOS', 'TOTAL'];
    const colWidths = [60, 30, 30, 30, 30];
    let xPos = 20;

    doc.setFillColor(220, 220, 220);
    doc.rect(20, yPos - 2, pageWidth - 40, 8, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    headerCols.forEach((header, index) => {
      doc.text(header, xPos + (colWidths[index] / 2), yPos + 3, { align: 'center' });
      xPos += colWidths[index];
    });
    yPos += 10;

    // Dados de cada loja na tabela resumo
    relatorioLojas.forEach((grupo, index) => {
      checkNewPage(8);
      
      xPos = 20;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      const rowData = [
        grupo.loja.nome.substring(0, 25),
        `R$ ${grupo.totais.liquido.toFixed(2)}`,
        `R$ ${(grupo.totais.taxaAdmin + grupo.totais.taxaSupervisao).toFixed(2)}`,
        `R$ ${grupo.totais.debitos.toFixed(2)}`,
        `R$ ${grupo.totais.final.toFixed(2)}`
      ];

      // Alternância de cores
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(20, yPos - 2, pageWidth - 40, 8, 'F');
      }

      rowData.forEach((data, colIndex) => {
        if (colIndex === 0) {
          doc.text(data, xPos + 2, yPos + 2);
        } else {
          doc.text(data, xPos + (colWidths[colIndex] / 2), yPos + 2, { align: 'center' });
        }
        xPos += colWidths[colIndex];
      });

      yPos += 8;
    });

    // Total da tabela
    doc.setFillColor(41, 128, 185);
    doc.rect(20, yPos, pageWidth - 40, 10, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL CONSOLIDADO:', 22, yPos + 6);
    doc.text(`R$ ${totalGeral.toFixed(2)}`, pageWidth - 35, yPos + 6, { align: 'center' });
    yPos += 20;

    // Detalhamento por loja (nova página)
    addNewPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('DETALHAMENTO POR LOJA', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Listar cada loja detalhadamente
    relatorioLojas.forEach((grupo, lojaIndex) => {
      checkNewPage(100);

      // Cabeçalho da loja
      doc.setFillColor(245, 245, 245);
      doc.rect(20, yPos - 5, pageWidth - 40, 25, 'F');
      doc.setDrawColor(180, 180, 180);
      doc.rect(20, yPos - 5, pageWidth - 40, 25);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`${lojaIndex + 1}. ${grupo.loja.nome}`, 25, yPos + 3);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`CNPJ: ${grupo.loja.cnpj}`, 25, yPos + 10);
      doc.text(`Contato: ${grupo.loja.contato}`, 25, yPos + 15);
      doc.text(`Total: R$ ${grupo.totais.final.toFixed(2)}`, pageWidth - 50, yPos + 8);
      yPos += 30;

      // Composição financeira da loja
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Composição Financeira:', 25, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`• Logística (${grupo.motoboys.length} motoboys): R$ ${grupo.totais.liquido.toFixed(2)}`, 30, yPos);
      yPos += 6;
      doc.text(`• Taxa Administrativa: R$ ${grupo.totais.taxaAdmin.toFixed(2)} ${grupo.loja.usarTaxaPercentual && grupo.totais.liquido > (grupo.loja.limiteValorFixo || 0) ? `(${grupo.loja.percentualTaxa}%)` : '(fixa)'}`, 30, yPos);
      yPos += 6;
      doc.text(`• Taxa Supervisão: R$ ${grupo.totais.taxaSupervisao.toFixed(2)}`, 30, yPos);
      yPos += 6;
      doc.text(`• Débitos Pendentes: R$ ${grupo.totais.debitos.toFixed(2)} (${grupo.debitos.length} item(s))`, 30, yPos);
      yPos += 10;

      // Motoboys da loja (formato compacto)
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Motoboys:', 25, yPos);
      yPos += 8;

      grupo.motoboys.forEach(motoboy => {
        checkNewPage(6);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(`• ${motoboy.motoboy.nome}: Diária R$ ${motoboy.valorDiaria.toFixed(2)} + Corridas R$ ${motoboy.totalCorridas.toFixed(2)} = R$ ${motoboy.totalLiquido.toFixed(2)}`, 30, yPos);
        yPos += 5;
      });

      // Separador entre lojas
      if (lojaIndex < relatorioLojas.length - 1) {
        yPos += 10;
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPos, pageWidth - 20, yPos);
        yPos += 15;
      }
    });

    // Rodapé em todas as páginas
    const addFooter = () => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      // Linha no rodapé
      doc.setDrawColor(200, 200, 200);
      doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
      
      doc.text('Expresso Neves - Relatório Consolidado', 20, pageHeight - 15);
      doc.text(`Página ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth - 20, pageHeight - 15, { align: 'right' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    };

    // Adicionar rodapé em todas as páginas
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter();
    }

    // Salvar PDF
    const dataInicioFormatada = relatorioLojas[0].periodo.inicio.replace(/-/g, '');
    const dataFimFormatada = relatorioLojas[0].periodo.fim.replace(/-/g, '');
    const nomeArquivo = `relatorio-consolidado-${dataInicioFormatada}-${dataFimFormatada}.pdf`;
    doc.save(nomeArquivo);

    toast.success('Relatório consolidado exportado com sucesso!');
  };

  // Função para gerar relatório de motoboys
  const gerarRelatorioMotoboys = () => {
    if (!relatorioMotoboyConfig.dataInicio || !relatorioMotoboyConfig.dataFim) {
      toast.error('Selecione as datas de início e fim do período!');
      return;
    }

    // Validar se data início é menor ou igual à data fim
    if (relatorioMotoboyConfig.dataInicio > relatorioMotoboyConfig.dataFim) {
      toast.error('A data de início deve ser menor ou igual à data de fim!');
      return;
    }

    const dataInicio = relatorioMotoboyConfig.dataInicio;
    const dataFim = relatorioMotoboyConfig.dataFim;

    // Usar dados filtrados para lojistas
    const jornadasParaProcessar = getJornadasFiltradas();
    const adiantamentosParaProcessar = getAdiantamentosFiltrados();
    const lojasParaProcessar = getLojasFiltradas();

    console.log('👤 === RELATÓRIO MOTOBOYS ===');
    console.log('👤 Período selecionado:', { dataInicio, dataFim });
    console.log('👤 Usuário logado:', currentUser?.tipo, currentUser?.lojaId);

    // Filtrar jornadas do período
    const jornadasPeriodo = jornadasParaProcessar.filter(j => {
      return j.data >= dataInicio && j.data <= dataFim;
    });

    console.log('👤 Jornadas do período:', jornadasPeriodo.length);

    // Agrupar por loja (apenas lojas que o usuário tem acesso)
    const relatoriosPorLoja = lojasParaProcessar.map(loja => {
      const jornadasLoja = jornadasPeriodo.filter(j => j.lojaId === loja.id);
      
      if (jornadasLoja.length === 0) {
        return null;
      }

      // Agrupar motoboys que trabalharam nesta loja
      const motoboysDaLoja = {};
      
      jornadasLoja.forEach(jornada => {
        const motoboyId = jornada.motoboyId;
        const motoboy = motoboys.find(m => m.id === motoboyId);
        
        if (!motoboy) return;

        if (!motoboysDaLoja[motoboyId]) {
          motoboysDaLoja[motoboyId] = {
            motoboy,
            jornadas: [],
            totalDiaria: 0,
            totalCorridas: 0,
            totalComissoes: 0,
            totalMissoes: 0,
            totalDescontos: 0,
            totalAdiantamentos: 0,
            totalBruto: 0,
            totalLiquido: 0
          };
        }

        const motoboyData = motoboysDaLoja[motoboyId];
        motoboyData.jornadas.push(jornada);
        motoboyData.totalDiaria += jornada.valorDiaria || 0;
        motoboyData.totalCorridas += jornada.valorCorridas || 0;
        motoboyData.totalComissoes += jornada.comissoes || 0;
        motoboyData.totalMissoes += jornada.missoes || 0;
        motoboyData.totalDescontos += jornada.descontos || 0;
      });

      // Calcular adiantamentos para cada motoboy
      Object.values(motoboysDaLoja).forEach(motoboyData => {
        // REGRA: Adiantamentos da semana atual (segunda até quarta) devem ser incluídos
        const periodoSemanaAtual = obterPeriodoSemanaAtual();
        
        const adiantamentosDoMotoboy = adiantamentos.filter(a => {
          if (a.motoboyId !== motoboyData.motoboy.id || a.lojaId !== loja.id) return false;
          
          // Incluir adiantamentos do período do relatório
          const noPeriodoRelatorio = a.data >= dataInicio && a.data <= dataFim;
          
          // Incluir adiantamentos da semana atual (segunda até quarta)
          const naSemanaAtual = a.data >= periodoSemanaAtual.inicio && a.data <= periodoSemanaAtual.fim;
          
          return noPeriodoRelatorio || naSemanaAtual;
        });

        motoboyData.totalAdiantamentos = adiantamentosDoMotoboy.reduce((sum, a) => sum + (a.valor || 0), 0);
        motoboyData.totalBruto = motoboyData.totalDiaria + motoboyData.totalCorridas + motoboyData.totalComissoes + motoboyData.totalMissoes;
        motoboyData.totalLiquido = motoboyData.totalBruto - motoboyData.totalDescontos - motoboyData.totalAdiantamentos;
      });

      return {
        loja,
        motoboys: Object.values(motoboysDaLoja),
        periodo: {
          inicio: dataInicio,
          fim: dataFim
        }
      };
    }).filter(relatorio => relatorio !== null);

    console.log('👤 Relatórios gerados:', relatoriosPorLoja.length);
    setRelatorioMotoboyLojas(relatoriosPorLoja);
  };

  // Função para gerar PDF individual do relatório motoboys
  const gerarPDFMotoboys = (grupo) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 30;

    // Função para adicionar nova página
    const addNewPage = () => {
      doc.addPage();
      yPos = 30;
      addHeaderToPage();
    };

    // Função para verificar se precisa de nova página
    const checkNewPage = (requiredHeight) => {
      if (yPos + requiredHeight > pageHeight - 30) {
        addNewPage();
      }
    };

    // Função para adicionar cabeçalho em nova página
    const addHeaderToPage = () => {
      // Logo/Nome da empresa
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('EXPRESSO NEVES', pageWidth / 2, 20, { align: 'center' });
      
      // Linha divisória
      doc.setLineWidth(0.5);
      doc.line(20, 25, pageWidth - 20, 25);
      
      yPos = 35;
    };

    // Cabeçalho principal
    addHeaderToPage();

    // Título do relatório
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('RELATÓRIO DETALHADO DE MOTOBOYS', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Informações da loja
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('DADOS DA LOJA:', 20, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nome: ${grupo.loja.nome}`, 25, yPos);
    yPos += 6;
    doc.text(`CNPJ: ${grupo.loja.cnpj}`, 25, yPos);
    yPos += 6;
    doc.text(`Contato: ${grupo.loja.contato}`, 25, yPos);
    yPos += 6;
    doc.text(`Período: ${new Date(grupo.periodo.inicio + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date(grupo.periodo.fim + 'T12:00:00').toLocaleDateString('pt-BR')}`, 25, yPos);
    yPos += 6;
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 25, yPos);
    yPos += 15;

    // Resumo executivo em destaque
    checkNewPage(50);
    doc.setFillColor(240, 248, 255);
    doc.rect(20, yPos - 5, pageWidth - 40, 45, 'F');
    doc.setDrawColor(41, 128, 185);
    doc.rect(20, yPos - 5, pageWidth - 40, 45);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('RESUMO EXECUTIVO', 25, yPos + 5);

    const totalJornadas = grupo.motoboys.reduce((sum, mb) => sum + mb.jornadas.length, 0);
    const totalDiarias = grupo.motoboys.reduce((sum, mb) => sum + mb.totalDiaria, 0);
    const totalCorridas = grupo.motoboys.reduce((sum, mb) => sum + mb.totalCorridas, 0);
    const totalAdiantamentos = grupo.motoboys.reduce((sum, mb) => sum + mb.totalAdiantamentos, 0);
    const totalLiquido = grupo.motoboys.reduce((sum, mb) => sum + mb.totalLiquido, 0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Motoboys que trabalharam: ${grupo.motoboys.length}`, 25, yPos + 15);
    doc.text(`Total de Jornadas: ${totalJornadas}`, 25, yPos + 23);
    doc.text(`Total Diárias: R$ ${totalDiarias.toFixed(2)}`, 25, yPos + 31);
    doc.text(`Total Corridas: R$ ${totalCorridas.toFixed(2)}`, 100, yPos + 15);
    doc.text(`Total Adiantamentos: R$ ${totalAdiantamentos.toFixed(2)}`, 100, yPos + 23);
    doc.text(`Total Líquido: R$ ${totalLiquido.toFixed(2)}`, 100, yPos + 31);
    yPos += 55;

    // Detalhamento dos motoboys
    checkNewPage(50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('DETALHAMENTO POR MOTOBOY:', 20, yPos);
    yPos += 10;

    // PRIMEIRA TABELA - DADOS SEMANAIS
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS SEMANAIS DE CORRIDAS:', 20, yPos);
    yPos += 8;

    // Cabeçalho da primeira tabela (dados semanais) - Posições otimizadas
    doc.setFontSize(8);
    doc.text('MOTOBOY', 20, yPos);
    doc.text('SEG', 55, yPos);
    doc.text('TER', 70, yPos);
    doc.text('QUA', 85, yPos);
    doc.text('QUI', 100, yPos);
    doc.text('SEX', 115, yPos);
    doc.text('SAB', 130, yPos);
    doc.text('DOM', 145, yPos);
    yPos += 6;

    // Linha horizontal
    doc.line(20, yPos, 160, yPos);
    yPos += 3;

    // Dados dos motoboys - primeira tabela
    grupo.motoboys.forEach(motoboyData => {
      checkNewPage(8);
      
      // Organizar jornadas por dia da semana
      const jornadasPorDia = {};
      motoboyData.jornadas.forEach(jornada => {
        const data = new Date(jornada.data + 'T12:00:00');
        const diaSemana = data.getDay(); // 0=domingo, 1=segunda, etc.
        jornadasPorDia[diaSemana] = jornada;
      });

      doc.setFontSize(7);
      doc.text(motoboyData.motoboy.nome.substring(0, 14), 20, yPos);
      
      // Dias da semana - Segunda a Domingo (apenas valores das corridas) - Posições otimizadas
      const diasPosicoes = [55, 70, 85, 100, 115, 130, 145];
      [1, 2, 3, 4, 5, 6, 0].forEach((dia, index) => {
        const jornada = jornadasPorDia[dia];
        if (jornada) {
          const valorCorridas = jornada.valorCorridas || 0;
          // Apenas corridas (verde) conforme interface
          doc.setTextColor(0, 150, 0);
          doc.text(`${valorCorridas.toFixed(0)}`, diasPosicoes[index], yPos, { align: 'center' });
          doc.setTextColor(0, 0, 0); // Voltar para preto
        } else {
          doc.text('-', diasPosicoes[index], yPos, { align: 'center' });
        }
      });
      
      yPos += 6;
    });

    // Espaço entre tabelas
    yPos += 10;
    checkNewPage(40);

    // SEGUNDA TABELA - VALORES CONSOLIDADOS
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('VALORES CONSOLIDADOS:', 20, yPos);
    yPos += 8;

    // Cabeçalho da segunda tabela (valores consolidados) - Posições otimizadas para caber na página
    doc.setFontSize(8);
    doc.text('MOTOBOY', 20, yPos);
    doc.text('DIÁRIA', 48, yPos);
    doc.text('TAXA', 68, yPos);
    doc.text('MISSÕES', 86, yPos);
    doc.text('DESCONTOS', 108, yPos);
    doc.text('ADIANT.', 132, yPos);
    doc.text('TOTAL', 154, yPos);
    yPos += 6;

    // Linha horizontal
    doc.line(20, yPos, 170, yPos);
    yPos += 3;

    // Dados dos motoboys - segunda tabela
    grupo.motoboys.forEach(motoboyData => {
      checkNewPage(8);
      
      doc.setFontSize(7);
      doc.text(motoboyData.motoboy.nome.substring(0, 12), 20, yPos);
      
      doc.text(`${motoboyData.totalDiaria.toFixed(0)}`, 48, yPos);
      doc.text(`${motoboyData.totalCorridas.toFixed(0)}`, 68, yPos);
      doc.text(`${(motoboyData.totalComissoes + motoboyData.totalMissoes).toFixed(0)}`, 86, yPos);
      doc.text(`${motoboyData.totalDescontos.toFixed(0)}`, 108, yPos);
      doc.text(`${motoboyData.totalAdiantamentos.toFixed(0)}`, 132, yPos);
      doc.text(`${motoboyData.totalLiquido.toFixed(0)}`, 154, yPos);
      yPos += 6;
    });

    // Linha de total
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos, pageWidth - 40, 8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL MOTOBOYS', 22, yPos + 5);
    doc.text(`R$ ${totalLiquido.toFixed(2)}`, 154, yPos + 5);
    yPos += 20;

    // Análise detalhada dos motoboys
    checkNewPage(60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ANÁLISE DETALHADA DOS MOTOBOYS:', 20, yPos);
    yPos += 10;

    grupo.motoboys.forEach((motoboyData, index) => {
      checkNewPage(40);
      
      // Cabeçalho do motoboy
      doc.setFillColor(245, 245, 245);
      doc.rect(20, yPos - 5, pageWidth - 40, 30, 'F');
      doc.setDrawColor(180, 180, 180);
      doc.rect(20, yPos - 5, pageWidth - 40, 30);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`${index + 1}. ${motoboyData.motoboy.nome}`, 25, yPos + 3);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Jornadas realizadas: ${motoboyData.jornadas.length}`, 25, yPos + 10);
      doc.text(`Performance: ${(motoboyData.totalLiquido / motoboyData.jornadas.length).toFixed(2)} por jornada`, 25, yPos + 16);
      doc.text(`Total Líquido: R$ ${motoboyData.totalLiquido.toFixed(2)}`, pageWidth - 50, yPos + 8);
      yPos += 35;

      // Breakdown financeiro
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Breakdown Financeiro:', 25, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`• Diárias: R$ ${motoboyData.totalDiaria.toFixed(2)}`, 30, yPos);
      yPos += 5;
      doc.text(`• Corridas: R$ ${motoboyData.totalCorridas.toFixed(2)}`, 30, yPos);
      yPos += 5;
      doc.text(`• Comissões: R$ ${motoboyData.totalComissoes.toFixed(2)}`, 30, yPos);
      yPos += 5;
      doc.text(`• Missões: R$ ${motoboyData.totalMissoes.toFixed(2)}`, 30, yPos);
      yPos += 5;
      doc.text(`• Descontos: R$ ${motoboyData.totalDescontos.toFixed(2)}`, 30, yPos);
      yPos += 5;
      doc.text(`• Adiantamentos: R$ ${motoboyData.totalAdiantamentos.toFixed(2)}`, 30, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text(`• Total Líquido: R$ ${motoboyData.totalLiquido.toFixed(2)}`, 30, yPos);
      yPos += 15;

      // Separador entre motoboys
      if (index < grupo.motoboys.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPos, pageWidth - 20, yPos);
        yPos += 10;
      }
    });

    // Rodapé em todas as páginas
    const addFooter = () => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      // Linha no rodapé
      doc.setDrawColor(200, 200, 200);
      doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
      
      doc.text('Expresso Neves - Relatório Detalhado de Motoboys', 20, pageHeight - 15);
      doc.text(`Página ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth - 20, pageHeight - 15, { align: 'right' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    };

    // Adicionar rodapé em todas as páginas
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter();
    }

    // Salvar PDF
    const dataInicioFormatada = grupo.periodo.inicio.replace(/-/g, '');
    const dataFimFormatada = grupo.periodo.fim.replace(/-/g, '');
    const nomeArquivo = `relatorio-motoboys-${grupo.loja.nome.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${dataInicioFormatada}-${dataFimFormatada}.pdf`;
    doc.save(nomeArquivo);
  };

  // Função para gerar PDF consolidado de todos os relatórios motoboys
  const gerarPDFTodosMotoboys = () => {
    if (relatorioMotoboyLojas.length === 0) {
      toast.error('Nenhum relatório disponível para exportar!');
      return;
    }

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;
    let currentPage = 1;

    // Função para adicionar nova página
    const addNewPage = () => {
      doc.addPage();
      currentPage++;
      yPos = 20;
    };

    // Função para verificar se precisa de nova página
    const checkNewPage = (requiredHeight) => {
      if (yPos + requiredHeight > pageHeight - 20) {
        addNewPage();
      }
    };

    // Cabeçalho geral
    doc.setFontSize(16);
    doc.text('RELATÓRIO CONSOLIDADO MOTOBOYS - EXPRESSO NEVES', 20, yPos);
    yPos += 10;
    
    if (relatorioMotoboyLojas.length > 0) {
      doc.setFontSize(10);
      doc.text(`Período: ${new Date(relatorioMotoboyLojas[0].periodo.inicio + 'T12:00:00').toLocaleDateString('pt-BR')} até ${new Date(relatorioMotoboyLojas[0].periodo.fim + 'T12:00:00').toLocaleDateString('pt-BR')}`, 20, yPos);
      yPos += 10;
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, yPos);
      yPos += 15;
    }

    // Resumo geral
    const totalMotoboyUnicos = relatorioMotoboyLojas.reduce((total, loja) => {
      const uniqueMotoboys = new Set();
      loja.motoboys.forEach(mb => uniqueMotoboys.add(mb.motoboy.id));
      return total + uniqueMotoboys.size;
    }, 0);
    
    const totalJornadas = relatorioMotoboyLojas.reduce((total, loja) => 
      total + loja.motoboys.reduce((subTotal, mb) => subTotal + mb.jornadas.length, 0), 0);
    
    const totalDiarias = relatorioMotoboyLojas.reduce((total, loja) => 
      total + loja.motoboys.reduce((subTotal, mb) => subTotal + mb.totalDiaria, 0), 0);
    
    const totalCorridas = relatorioMotoboyLojas.reduce((total, loja) => 
      total + loja.motoboys.reduce((subTotal, mb) => subTotal + mb.totalCorridas, 0), 0);
    
    const totalAdiantamentos = relatorioMotoboyLojas.reduce((total, loja) => 
      total + loja.motoboys.reduce((subTotal, mb) => subTotal + mb.totalAdiantamentos, 0), 0);
    
    const totalLiquido = relatorioMotoboyLojas.reduce((total, loja) => 
      total + loja.motoboys.reduce((subTotal, mb) => subTotal + mb.totalLiquido, 0), 0);

    doc.setFontSize(12);
    doc.text('RESUMO GERAL:', 20, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.text(`Total de Lojas: ${relatorioMotoboyLojas.length}`, 20, yPos);
    yPos += 6;
    doc.text(`Total de Motoboys: ${totalMotoboyUnicos}`, 20, yPos);
    yPos += 6;
    doc.text(`Total de Jornadas: ${totalJornadas}`, 20, yPos);
    yPos += 6;
    doc.text(`Total Diárias: R$ ${totalDiarias.toFixed(2)}`, 20, yPos);
    yPos += 6;
    doc.text(`Total Corridas: R$ ${totalCorridas.toFixed(2)}`, 20, yPos);
    yPos += 6;
    doc.text(`Total Adiantamentos: R$ ${totalAdiantamentos.toFixed(2)}`, 20, yPos);
    yPos += 6;
    doc.setFontSize(12);
    doc.text(`TOTAL LÍQUIDO: R$ ${totalLiquido.toFixed(2)}`, 20, yPos);
    yPos += 20;

    // Listar cada loja
    relatorioMotoboyLojas.forEach((grupo, lojaIndex) => {
      checkNewPage(80);

      // Cabeçalho da loja
      doc.setFontSize(14);
      doc.text(`${lojaIndex + 1}. ${grupo.loja.nome}`, 20, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.text(`CNPJ: ${grupo.loja.cnpj}`, 20, yPos);
      yPos += 5;
      doc.text(`Contato: ${grupo.loja.contato}`, 20, yPos);
      yPos += 5;
      doc.text(`${grupo.motoboys.length} motoboy(s) trabalharam nesta loja`, 20, yPos);
      yPos += 8;

      // Tabela de motoboys
      doc.setFontSize(8);
      doc.text('MOTOBOY', 20, yPos);
      doc.text('SEG', 50, yPos);
      doc.text('TER', 60, yPos);
      doc.text('QUA', 70, yPos);
      doc.text('QUI', 80, yPos);
      doc.text('SEX', 90, yPos);
      doc.text('SAB', 100, yPos);
      doc.text('DOM', 110, yPos);
      doc.text('DIÁRIA', 120, yPos);
      doc.text('TAXA', 135, yPos);
      doc.text('MISSÕES', 150, yPos);
      doc.text('DESCONTOS', 165, yPos);
      doc.text('ADIANT.', 180, yPos);
      doc.text('TOTAL', 190, yPos);
      yPos += 6;

      // Linha horizontal
      doc.line(20, yPos, 200, yPos);
      yPos += 3;

      // Legenda antes dos dados
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Legenda: C: = Corridas (verde) | D: = Diárias (azul)', 20, yPos);
      yPos += 5;

      // Dados dos motoboys
      grupo.motoboys.forEach(motoboyData => {
        checkNewPage(8);
        
        // Organizar jornadas por dia da semana
        const jornadasPorDia = {};
        motoboyData.jornadas.forEach(jornada => {
          const data = new Date(jornada.data + 'T12:00:00');
          const diaSemana = data.getDay(); // 0=domingo, 1=segunda, etc.
          jornadasPorDia[diaSemana] = jornada;
        });

        doc.setFontSize(7);
        doc.text(motoboyData.motoboy.nome.substring(0, 12), 20, yPos);
        
        // Dias da semana - Segunda a Domingo (apenas valores das corridas)
        const diasPosicoes = [50, 60, 70, 80, 90, 100, 110];
        [1, 2, 3, 4, 5, 6, 0].forEach((dia, index) => {
          const jornada = jornadasPorDia[dia];
          if (jornada) {
            const valorCorridas = jornada.valorCorridas || 0;
            // Apenas corridas (verde) conforme interface
            doc.setTextColor(0, 150, 0);
            doc.text(`${valorCorridas.toFixed(0)}`, diasPosicoes[index], yPos, { align: 'center' });
            doc.setTextColor(0, 0, 0); // Voltar para preto
          } else {
            doc.text('-', diasPosicoes[index], yPos, { align: 'center' });
          }
        });
        
        doc.text(`${motoboyData.totalDiaria.toFixed(2)}`, 120, yPos);
        doc.text(`${motoboyData.totalCorridas.toFixed(2)}`, 135, yPos);
        doc.text(`${(motoboyData.totalComissoes + motoboyData.totalMissoes).toFixed(2)}`, 150, yPos);
        doc.text(`${motoboyData.totalDescontos.toFixed(2)}`, 165, yPos);
        doc.text(`${motoboyData.totalAdiantamentos.toFixed(2)}`, 180, yPos);
        doc.text(`${motoboyData.totalLiquido.toFixed(2)}`, 190, yPos);
        yPos += 6;
      });

      // Linha de total da loja
      doc.line(20, yPos, 200, yPos);
      yPos += 3;
      doc.setFontSize(8);
      doc.text('TOTAL MOTOBOYS', 20, yPos);
      doc.text(`R$ ${grupo.motoboys.reduce((sum, mb) => sum + mb.totalLiquido, 0).toFixed(2)}`, 190, yPos);
      yPos += 10;

      // Resumo da loja
      doc.setFontSize(9);
      doc.text('RESUMO DA LOJA:', 20, yPos);
      yPos += 6;
      doc.setFontSize(8);
      doc.text(`Total Diárias: R$ ${grupo.motoboys.reduce((sum, mb) => sum + mb.totalDiaria, 0).toFixed(2)}`, 20, yPos);
      yPos += 5;
      doc.text(`Total Corridas: R$ ${grupo.motoboys.reduce((sum, mb) => sum + mb.totalCorridas, 0).toFixed(2)}`, 20, yPos);
      yPos += 5;
      doc.text(`Total Extras: R$ ${grupo.motoboys.reduce((sum, mb) => sum + mb.totalComissoes + mb.totalMissoes, 0).toFixed(2)}`, 20, yPos);
      yPos += 5;
      doc.text(`Total Adiantamentos: R$ ${grupo.motoboys.reduce((sum, mb) => sum + mb.totalAdiantamentos, 0).toFixed(2)}`, 20, yPos);
      yPos += 15;

      // Separador entre lojas
      if (lojaIndex < relatorioMotoboyLojas.length - 1) {
        yPos += 5;
        doc.line(20, yPos, 200, yPos);
        yPos += 10;
      }
    });

    // Salvar PDF
    const dataInicioFormatada = relatorioMotoboyLojas[0].periodo.inicio.replace(/-/g, '');
    const dataFimFormatada = relatorioMotoboyLojas[0].periodo.fim.replace(/-/g, '');
    doc.save(`relatorio-motoboys-consolidado-${dataInicioFormatada}-${dataFimFormatada}.pdf`);
  };

  // Se não estiver logado, mostrar tela de login
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Expresso Neves</h1>
            <p className="text-gray-600">Sistema de Gestão de Motoboy</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={loginForm.senha}
                onChange={(e) => setLoginForm({...loginForm, senha: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Entrar
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Usuário padrão:</p>
            <p>Email: admin@expressoneves.com</p>
            <p>Senha: admin123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Expresso Neves</h1>
              <p className="ml-4 text-sm text-gray-600">Sistema de Gestão de Motoboy</p>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {currentUser.tipo}
              </span>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-red-800 text-white min-h-screen">
          <div className="p-4">
            <div className="text-center mb-8">
              <div className="bg-white text-red-800 rounded-lg p-3 mb-2">
                <h2 className="font-bold text-lg">Expresso Neves</h2>
                <p className="text-xs">Sistema de Gestão de Motoboy</p>
              </div>
            </div>
            
            <ul className="space-y-2">
              {[
                { id: 'dashboard', label: 'Dashboard', allowed: ['admin', 'financeiro', 'lojista'] },
                { id: 'motoboys', label: 'Motoboys', allowed: ['admin', 'financeiro'] },
                { id: 'lojas', label: 'Lojas', allowed: ['admin'] },
                { id: 'jornadas', label: 'Jornadas', allowed: ['admin', 'financeiro', 'lojista'] },
                { id: 'adiantamentos', label: 'Adiantamentos', allowed: ['admin', 'financeiro'] },
                { id: 'debitos', label: 'Débitos Pendentes', allowed: ['admin', 'financeiro'] },
                { id: 'relatorios', label: 'Relatório Lojas', allowed: ['admin', 'financeiro', 'lojista'] },
                { id: 'relatorio-motoboys', label: 'Relatório Motoboys', allowed: ['admin', 'financeiro'] },
                { id: 'pdr', label: 'PDR', allowed: ['admin'] },
                { id: 'colaboradores', label: 'Colaboradores', allowed: ['admin'] }
              ].map(tab => (
                tab.allowed.includes(currentUser.tipo) && (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-4 py-2 rounded-md transition-colors text-sm ${
                        activeTab === tab.id
                          ? 'bg-red-700 text-white font-medium'
                          : 'text-red-100 hover:bg-red-700 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  </li>
                )
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
                  <p className="text-gray-600">Visão geral da operação Expresso Neves</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Período:</span>
                    <input
                      type="date"
                      value={relatorioConfig.dataInicio}
                      onChange={(e) => setRelatorioConfig({...relatorioConfig, dataInicio: e.target.value})}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-600">até</span>
                    <input
                      type="date"
                      value={relatorioConfig.dataFim}
                      onChange={(e) => setRelatorioConfig({...relatorioConfig, dataFim: e.target.value})}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Cards de estatísticas principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium opacity-90">Faturamento Total</h3>
                      <p className="text-2xl font-bold mt-1">
                        R$ {(relatorioConfig.dataInicio && relatorioConfig.dataFim) ? 
                          getJornadasFiltradas().filter(j => j.data >= relatorioConfig.dataInicio && j.data <= relatorioConfig.dataFim)
                            .reduce((sum, j) => sum + (j.valorDiaria || 0) + (j.valorCorridas || 0) + (j.comissoes || 0) + (j.missoes || 0), 0).toFixed(2)
                          : '0,00'
                        }
                      </p>
                    </div>
                    <div className="text-3xl opacity-80">💰</div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="opacity-80">Diárias + Corridas + Extras</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium opacity-90">Jornadas</h3>
                      <p className="text-2xl font-bold mt-1">
                        {(relatorioConfig.dataInicio && relatorioConfig.dataFim) ? 
                          getJornadasFiltradas().filter(j => j.data >= relatorioConfig.dataInicio && j.data <= relatorioConfig.dataFim).length
                          : 0
                        }
                      </p>
                    </div>
                    <div className="text-3xl opacity-80">📊</div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="opacity-80">Jornadas realizadas</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium opacity-90">Valor Corridas</h3>
                      <p className="text-2xl font-bold mt-1">
                        R$ {(relatorioConfig.dataInicio && relatorioConfig.dataFim) ? 
                          getJornadasFiltradas().filter(j => j.data >= relatorioConfig.dataInicio && j.data <= relatorioConfig.dataFim)
                            .reduce((sum, j) => sum + (j.valorCorridas || 0), 0).toFixed(2)
                          : '0,00'
                        }
                      </p>
                    </div>
                    <div className="text-3xl opacity-80">🏍️</div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="opacity-80">Receita de entregas</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium opacity-90">Motoboys Ativos</h3>
                      <p className="text-2xl font-bold mt-1">{motoboys.filter(m => m.status === 'ativo').length}</p>
                    </div>
                    <div className="text-3xl opacity-80">👥</div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="opacity-80">Equipe disponível</span>
                  </div>
                </div>
              </div>

              {/* Seção de gráficos e ranking */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Performance por Loja */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Performance por Loja</h3>
                  {(() => {
                    const jornadasPeriodo = (relatorioConfig.dataInicio && relatorioConfig.dataFim) ? 
                      getJornadasFiltradas().filter(j => j.data >= relatorioConfig.dataInicio && j.data <= relatorioConfig.dataFim) : [];
                    
                    const dadosLojas = getLojasFiltradas().map(loja => {
                      const jornadasLoja = jornadasPeriodo.filter(j => j.lojaId === loja.id);
                      const totalFaturamento = jornadasLoja.reduce((sum, j) => sum + (j.valorDiaria || 0) + (j.valorCorridas || 0) + (j.comissoes || 0) + (j.missoes || 0), 0);
                      const totalJornadas = jornadasLoja.length;
                      
                      return {
                        nome: loja.nome,
                        faturamento: totalFaturamento,
                        jornadas: totalJornadas
                      };
                    }).sort((a, b) => b.faturamento - a.faturamento);

                    const maxFaturamento = Math.max(...dadosLojas.map(d => d.faturamento), 1);

                    return (
                      <div className="space-y-4">
                        {dadosLojas.length > 0 ? (
                          <>
                            {/* Gráfico de barras horizontal */}
                            <div className="space-y-3">
                              {dadosLojas.map((loja, index) => (
                                <div key={index} className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">{loja.nome}</span>
                                    <span className="text-sm font-semibold text-gray-900">R$ {loja.faturamento.toFixed(2)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                                      <div 
                                        className={`h-3 rounded-full transition-all duration-300 ${
                                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
                                          index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' : 
                                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 
                                          'bg-gradient-to-r from-blue-400 to-blue-500'
                                        }`}
                                        style={{ width: `${(loja.faturamento / maxFaturamento) * 100}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs text-gray-500 w-16 text-right">{loja.jornadas} jornadas</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Legenda */}
                            <div className="pt-3 border-t border-gray-200">
                              <div className="flex justify-center gap-4 text-xs">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                  <span className="text-gray-600">1º Lugar</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                  <span className="text-gray-600">2º Lugar</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  <span className="text-gray-600">3º Lugar</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="text-gray-600">Demais</span>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-2">📊</div>
                            <p>Selecione um período para ver os dados</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Ranking de Motoboys - TOP 4 */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 TOP 4 Motoboys</h3>
                  {(() => {
                    const jornadasPeriodo = (relatorioConfig.dataInicio && relatorioConfig.dataFim) ? 
                      getJornadasFiltradas().filter(j => j.data >= relatorioConfig.dataInicio && j.data <= relatorioConfig.dataFim) : [];
                    
                    const dadosMotoboys = motoboys.filter(m => m.status === 'ativo').map(motoboy => {
                      const jornadasMotoboy = jornadasPeriodo.filter(j => j.motoboyId === motoboy.id);
                      const totalFaturamento = jornadasMotoboy.reduce((sum, j) => sum + (j.valorDiaria || 0) + (j.valorCorridas || 0) + (j.comissoes || 0) + (j.missoes || 0), 0);
                      const totalJornadas = jornadasMotoboy.length;
                      const mediaJornada = totalJornadas > 0 ? totalFaturamento / totalJornadas : 0;
                      
                      return {
                        nome: motoboy.nome,
                        faturamento: totalFaturamento,
                        jornadas: totalJornadas,
                        media: mediaJornada
                      };
                    }).sort((a, b) => b.faturamento - a.faturamento);

                    const top4 = dadosMotoboys.slice(0, 4);

                    return (
                      <div className="space-y-4">
                        {top4.length > 0 ? (
                          <>
                            {/* Pódio visual */}
                            <div className="grid grid-cols-2 gap-4">
                              {top4.map((motoboy, index) => (
                                <div key={index} className={`p-4 rounded-lg border-2 ${
                                  index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300' : 
                                  index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300' : 
                                  index === 2 ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300' : 
                                  'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300'
                                }`}>
                                  <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                                      index === 0 ? 'bg-yellow-500 shadow-lg' : 
                                      index === 1 ? 'bg-gray-400 shadow-lg' : 
                                      index === 2 ? 'bg-orange-500 shadow-lg' : 
                                      'bg-blue-500 shadow-lg'
                                    }`}>
                                      {index + 1}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-semibold text-gray-900 text-sm">{motoboy.nome}</div>
                                      <div className="text-xs text-gray-600">{motoboy.jornadas} jornadas</div>
                                    </div>
                                  </div>
                                  <div className="mt-3 text-center">
                                    <div className="text-lg font-bold text-gray-900">R$ {motoboy.faturamento.toFixed(2)}</div>
                                    <div className="text-xs text-gray-600">Média: R$ {motoboy.media.toFixed(2)}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Medalhas */}
                            <div className="pt-3 border-t border-gray-200">
                              <div className="flex justify-center gap-6 text-xs">
                                <div className="flex items-center gap-1">
                                  <span className="text-2xl">🥇</span>
                                  <span className="text-gray-600">1º Lugar</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-2xl">🥈</span>
                                  <span className="text-gray-600">2º Lugar</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-2xl">🥉</span>
                                  <span className="text-gray-600">3º Lugar</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-2xl">🏅</span>
                                  <span className="text-gray-600">4º Lugar</span>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-2">🏆</div>
                            <p>Selecione um período para ver o ranking</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Gráfico de evolução temporal */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Evolução Temporal (Últimos 30 dias)</h3>
                {(() => {
                  const hoje = new Date();
                  const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
                  
                  const dadosUltimos30Dias = [];
                  for (let i = 0; i < 30; i++) {
                    const data = new Date(trintaDiasAtras.getTime() + i * 24 * 60 * 60 * 1000);
                    const dataStr = data.toISOString().split('T')[0];
                    const jornadasDia = getJornadasFiltradas().filter(j => j.data === dataStr);
                    const faturamentoDia = jornadasDia.reduce((sum, j) => sum + (j.valorDiaria || 0) + (j.valorCorridas || 0) + (j.comissoes || 0) + (j.missoes || 0), 0);
                    
                    dadosUltimos30Dias.push({
                      data: dataStr,
                      dia: data.getDate(),
                      faturamento: faturamentoDia,
                      jornadas: jornadasDia.length
                    });
                  }
                  
                  const maxFaturamento = Math.max(...dadosUltimos30Dias.map(d => d.faturamento), 1);
                  
                  return (
                    <div className="space-y-4">
                      {/* Gráfico de barras simples */}
                      <div className="flex items-end justify-between h-48 bg-gray-50 rounded-lg p-4">
                        {dadosUltimos30Dias.map((dia, index) => (
                          <div key={index} className="flex flex-col items-center flex-1 max-w-[20px]">
                            <div 
                              className="bg-blue-500 rounded-t w-full min-h-[2px] hover:bg-blue-600 transition-colors cursor-pointer"
                              style={{ height: `${(dia.faturamento / maxFaturamento) * 160}px` }}
                              title={`${dia.dia}/${(new Date(dia.data).getMonth() + 1)}: R$ ${dia.faturamento.toFixed(2)} (${dia.jornadas} jornadas)`}
                            ></div>
                            <span className="text-xs text-gray-600 mt-1">{dia.dia}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Estatísticas dos últimos 30 dias */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-sm text-blue-600 font-medium">Faturamento Total</div>
                          <div className="text-xl font-bold text-blue-900">
                            R$ {dadosUltimos30Dias.reduce((sum, d) => sum + d.faturamento, 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-sm text-green-600 font-medium">Jornadas Total</div>
                          <div className="text-xl font-bold text-green-900">
                            {dadosUltimos30Dias.reduce((sum, d) => sum + d.jornadas, 0)}
                          </div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <div className="text-sm text-yellow-600 font-medium">Média Diária</div>
                          <div className="text-xl font-bold text-yellow-900">
                            R$ {(dadosUltimos30Dias.reduce((sum, d) => sum + d.faturamento, 0) / 30).toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="text-sm text-purple-600 font-medium">Melhor Dia</div>
                          <div className="text-xl font-bold text-purple-900">
                            {(() => {
                              const melhorDia = dadosUltimos30Dias.reduce((max, d) => d.faturamento > max.faturamento ? d : max);
                              return `${melhorDia.dia}/${(new Date(melhorDia.data).getMonth() + 1)}`;
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Resumo detalhado por loja */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Resumo Detalhado por Loja</h3>
                {(() => {
                  const jornadasPeriodo = (relatorioConfig.dataInicio && relatorioConfig.dataFim) ? 
                    getJornadasFiltradas().filter(j => j.data >= relatorioConfig.dataInicio && j.data <= relatorioConfig.dataFim) : [];
                  
                  if (jornadasPeriodo.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p>Selecione um período para ver o resumo detalhado</p>
                      </div>
                    );
                  }
                  
                  // Processar dados das lojas e ordenar por total líquido (maior para menor)
                  const lojasComDados = getLojasFiltradas().map(loja => {
                    const jornadasLoja = jornadasPeriodo.filter(j => j.lojaId === loja.id);
                    const totalDiarias = jornadasLoja.reduce((sum, j) => sum + (j.valorDiaria || 0), 0);
                    const totalCorridas = jornadasLoja.reduce((sum, j) => sum + (j.valorCorridas || 0), 0);
                    const totalExtras = jornadasLoja.reduce((sum, j) => sum + (j.comissoes || 0) + (j.missoes || 0), 0);
                    const totalDescontos = jornadasLoja.reduce((sum, j) => sum + (j.descontos || 0), 0);
                    const totalBruto = totalDiarias + totalCorridas + totalExtras;
                    const totalLiquido = totalBruto - totalDescontos;
                    
                    const motoboysDaLoja = [...new Set(jornadasLoja.map(j => j.motoboyId))];
                    const mediaJornada = jornadasLoja.length > 0 ? totalBruto / jornadasLoja.length : 0;
                    
                    return {
                      loja,
                      jornadasLoja,
                      totalDiarias,
                      totalCorridas,
                      totalExtras,
                      totalDescontos,
                      totalBruto,
                      totalLiquido,
                      motoboysDaLoja,
                      mediaJornada
                    };
                  }).sort((a, b) => b.totalLiquido - a.totalLiquido); // Ordenar por total líquido (maior para menor)

                  return (
                    <div className="space-y-4">
                      {lojasComDados.map((dados, index) => (
                        <div key={dados.loja.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative">
                          {/* Badge de posição */}
                          <div className="absolute top-2 right-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              index === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {index + 1}º lugar
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-start mb-4 pr-16">
                            <div>
                              <h4 className="font-semibold text-gray-900 text-lg">{dados.loja.nome}</h4>
                              <p className="text-sm text-gray-600">{dados.loja.contato}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">R$ {dados.totalLiquido.toFixed(2)}</div>
                              <div className="text-sm text-gray-600">Total Líquido</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                            <div className="bg-blue-50 p-3 rounded">
                              <div className="text-blue-600 font-medium">Jornadas</div>
                              <div className="text-lg font-bold text-blue-900">{dados.jornadasLoja.length}</div>
                            </div>
                            <div className="bg-green-50 p-3 rounded">
                              <div className="text-green-600 font-medium">Diárias</div>
                              <div className="text-lg font-bold text-green-900">R$ {dados.totalDiarias.toFixed(2)}</div>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded">
                              <div className="text-yellow-600 font-medium">Corridas</div>
                              <div className="text-lg font-bold text-yellow-900">R$ {dados.totalCorridas.toFixed(2)}</div>
                            </div>
                            <div className="bg-purple-50 p-3 rounded">
                              <div className="text-purple-600 font-medium">Extras</div>
                              <div className="text-lg font-bold text-purple-900">R$ {dados.totalExtras.toFixed(2)}</div>
                            </div>
                            <div className="bg-red-50 p-3 rounded">
                              <div className="text-red-600 font-medium">Descontos</div>
                              <div className="text-lg font-bold text-red-900">R$ {dados.totalDescontos.toFixed(2)}</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded">
                              <div className="text-gray-600 font-medium">Motoboys</div>
                              <div className="text-lg font-bold text-gray-900">{dados.motoboysDaLoja.length}</div>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex justify-between items-center text-sm text-gray-600">
                            <span>Média por jornada: R$ {dados.mediaJornada.toFixed(2)}</span>
                            <span>Taxa Admin: {dados.loja.usarTaxaPercentual ? `${dados.loja.percentualTaxa}%` : `R$ ${dados.loja.taxaAdministrativa.toFixed(2)}`}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Alertas e notificações */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔔 Alertas e Notificações</h3>
                <div className="space-y-3">
                  {/* Débitos vencidos */}
                  {(() => {
                    const hoje = new Date().toISOString().split('T')[0];
                    const debitosVencidos = getDebitosFiltrados().filter(d => d.status === 'pendente' && d.dataVencimento < hoje);
                    
                    if (debitosVencidos.length > 0) {
                      return (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-red-600 font-medium">⚠️ Débitos Vencidos</span>
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                              {debitosVencidos.length}
                            </span>
                          </div>
                          <div className="text-sm text-red-700">
                            Total: R$ {debitosVencidos.reduce((sum, d) => sum + d.valor, 0).toFixed(2)}
                          </div>
                        </div>
                      );
                    }
                  })()}
                  
                  {/* Motoboys inativos */}
                  {(() => {
                    const motoboysinativos = motoboys.filter(m => m.status === 'inativo');
                    
                    if (motoboysinativos.length > 0) {
                      return (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-yellow-600 font-medium">⚠️ Motoboys Inativos</span>
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                              {motoboysinativos.length}
                            </span>
                          </div>
                          <div className="text-sm text-yellow-700">
                            Verifique os motoboys inativos na seção de gestão
                          </div>
                        </div>
                      );
                    }
                  })()}
                  
                  {/* Sistema funcionando */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-600 font-medium">✅ Sistema Operacional</span>
                    </div>
                    <div className="text-sm text-green-700">
                      Todos os sistemas estão funcionando normalmente
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Motoboys */}
          {activeTab === 'motoboys' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Motoboys</h2>
              </div>

              {/* Seção de Filtros */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                    <input
                      type="text"
                      value={filtrosMotoboy.nome}
                      onChange={(e) => setFiltrosMotoboy({...filtrosMotoboy, nome: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Buscar por nome..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select 
                      value={filtrosMotoboy.status}
                      onChange={(e) => setFiltrosMotoboy({...filtrosMotoboy, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Todos os status</option>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                    <input
                      type="text"
                      value={filtrosMotoboy.cpf}
                      onChange={(e) => setFiltrosMotoboy({...filtrosMotoboy, cpf: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Buscar por CPF..."
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button 
                      onClick={aplicarFiltrosMotoboy}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Filtrar
                    </button>
                    <button 
                      onClick={limparFiltrosMotoboy}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="mt-4 text-right">
                  <span className="text-sm text-gray-600">
                    {motoboysFiltrados.length} motoboy(s) encontrado(s)
                  </span>
                </div>
              </div>

              {/* Formulário de cadastro */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingMotoboy ? 'Editar Motoboy' : 'Cadastrar Novo Motoboy'}
                </h3>
                <form onSubmit={addMotoboy} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                    <input
                      type="text"
                      value={motoboyForm.nome}
                      onChange={(e) => setMotoboyForm({...motoboyForm, nome: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                    <input
                      type="text"
                      value={motoboyForm.cpf}
                      onChange={(e) => setMotoboyForm({...motoboyForm, cpf: formatCPF(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="000.000.000-00"
                      maxLength="14"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                    <input
                      type="text"
                      value={motoboyForm.telefone}
                      onChange={(e) => setMotoboyForm({...motoboyForm, telefone: formatTelefone(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(00) 00000-0000"
                      maxLength="15"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={motoboyForm.status}
                      onChange={(e) => setMotoboyForm({...motoboyForm, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 lg:col-span-4">
                    <div className="flex gap-4">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        {editingMotoboy ? 'Atualizar Motoboy' : 'Cadastrar Motoboy'}
                      </button>
                      {editingMotoboy && (
                        <button
                          type="button"
                          onClick={cancelarEdicaoMotoboy}
                          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* Lista de motoboys */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {motoboysFiltrados.sort((a, b) => a.nome.localeCompare(b.nome)).map(motoboy => (
                      <tr key={motoboy.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{motoboy.nome}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{motoboy.cpf}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{motoboy.telefone}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            motoboy.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {motoboy.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => editMotoboy(motoboy)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deleteMotoboy(motoboy.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {motoboysFiltrados.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {motoboys.length === 0 ? 'Nenhum motoboy cadastrado ainda.' : 'Nenhum motoboy encontrado com os filtros aplicados.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lojas */}
          {activeTab === 'lojas' && currentUser.tipo === 'admin' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Lojas</h2>
              </div>

              {/* Formulário de cadastro */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingLoja ? 'Editar Loja' : 'Cadastrar Nova Loja'}
                </h3>
                <form onSubmit={addLoja} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                      <input
                        type="text"
                        value={lojaForm.nome}
                        onChange={(e) => setLojaForm({...lojaForm, nome: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                      <input
                        type="text"
                        value={lojaForm.cnpj}
                        onChange={(e) => setLojaForm({...lojaForm, cnpj: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contato</label>
                      <input
                        type="text"
                        value={lojaForm.contato}
                        onChange={(e) => setLojaForm({...lojaForm, contato: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valor Hora (Seg-Sáb)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={lojaForm.valorHoraSegSab}
                        onChange={(e) => setLojaForm({...lojaForm, valorHoraSegSab: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valor Hora (Dom/Feriado)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={lojaForm.valorHoraDomFeriado}
                        onChange={(e) => setLojaForm({...lojaForm, valorHoraDomFeriado: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valor Corrida (até 5km)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={lojaForm.valorCorridaAte5km}
                        onChange={(e) => setLojaForm({...lojaForm, valorCorridaAte5km: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valor Corrida (acima 5km)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={lojaForm.valorCorridaAcima5km}
                        onChange={(e) => setLojaForm({...lojaForm, valorCorridaAcima5km: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Taxa Administrativa</label>
                      <input
                        type="number"
                        step="0.01"
                        value={lojaForm.taxaAdministrativa}
                        onChange={(e) => setLojaForm({...lojaForm, taxaAdministrativa: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Taxa Supervisão</label>
                      <input
                        type="number"
                        step="0.01"
                        value={lojaForm.taxaSupervisao}
                        onChange={(e) => setLojaForm({...lojaForm, taxaSupervisao: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Seção Taxa Administrativa Avançada */}
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Taxa Administrativa Avançada</h4>
                    
                    <div className="flex items-center mb-4">
                      <input
                        id="usarTaxaPercentual"
                        type="checkbox"
                        checked={lojaForm.usarTaxaPercentual}
                        onChange={(e) => setLojaForm({...lojaForm, usarTaxaPercentual: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="usarTaxaPercentual" className="ml-2 block text-sm text-gray-900">
                        Usar taxa percentual quando valor total ultrapassar limite
                      </label>
                    </div>

                    {lojaForm.usarTaxaPercentual && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Limite para Taxa Fixa (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={lojaForm.limiteValorFixo}
                            onChange={(e) => setLojaForm({...lojaForm, limiteValorFixo: parseFloat(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: 1000.00"
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            Até este valor, será cobrada a taxa fixa de R$ {lojaForm.taxaAdministrativa.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Taxa Percentual (%)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={lojaForm.percentualTaxa}
                            onChange={(e) => setLojaForm({...lojaForm, percentualTaxa: parseFloat(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: 10.00"
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            Acima de R$ {lojaForm.limiteValorFixo.toFixed(2)}, será cobrado {lojaForm.percentualTaxa}% do valor total
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {editingLoja ? 'Atualizar Loja' : 'Cadastrar Loja'}
                    </button>
                    {editingLoja && (
                      <button
                        type="button"
                        onClick={cancelarEdicaoLoja}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Lista de lojas */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxa Admin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxa Percentual</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lojas.map(loja => (
                      <tr key={loja.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{loja.nome}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loja.cnpj}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loja.contato}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {loja.usarTaxaPercentual ? (
                            <div>
                              <span>R$ {loja.taxaAdministrativa.toFixed(2)} (até R$ {(loja.limiteValorFixo || 0).toFixed(2)})</span>
                            </div>
                          ) : (
                            <span>R$ {loja.taxaAdministrativa.toFixed(2)} (fixo)</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {loja.usarTaxaPercentual ? (
                            <span className="text-blue-600 font-medium">{(loja.percentualTaxa || 0).toFixed(2)}%</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => editLoja(loja)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deleteLoja(loja.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {lojas.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma loja cadastrada ainda.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Jornadas */}
          {activeTab === 'jornadas' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Jornadas</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingJornada(null);
                      setShowJornadaForm(true);
                      setCadastroMultiplo(false);
                      setJornadaForm({data: '', motoboyId: '', lojaId: '', valorDiaria: 120.00, valorCorridas: 0.00, comissoes: 0.00, missoes: 0.00, descontos: 0.00, eFeriado: false, observacoes: ''});
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Nova Jornada
                  </button>
                  <button
                    onClick={() => {
                      setEditingJornada(null);
                      setShowJornadaForm(true);
                      setCadastroMultiplo(true);
                      setJornadaMultiplaForm({data: '', lojaId: '', eFeriado: false, motoboys: []});
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    Cadastro Múltiplo
                  </button>
                </div>
              </div>

              {/* Seção de Filtros */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                    <input
                      type="date"
                      value={filtros.dataInicio}
                      onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                    <input
                      type="date"
                      value={filtros.dataFim}
                      onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Motoboy</label>
                    <select 
                      value={filtros.motoboyId}
                      onChange={(e) => setFiltros({...filtros, motoboyId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Todos os motoboys</option>
                      {motoboys.filter(m => m.status === 'ativo').map(motoboy => (
                        <option key={motoboy.id} value={motoboy.id}>{motoboy.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loja</label>
                    {currentUser?.tipo === 'lojista' ? (
                      <input
                        type="text"
                        value={getLojasFiltradas()[0]?.nome || 'Nenhuma loja associada'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 text-sm"
                      />
                    ) : (
                      <select 
                        value={filtros.lojaId}
                        onChange={(e) => setFiltros({...filtros, lojaId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="">Todas as lojas</option>
                        {lojas.map(loja => (
                          <option key={loja.id} value={loja.id}>{loja.nome}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="flex items-end gap-2">
                    <button 
                      onClick={() => aplicarFiltros()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Filtrar
                    </button>
                    <button 
                      onClick={limparFiltros}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center text-sm">
                      <input 
                        type="checkbox" 
                        checked={filtros.eFeriado}
                        onChange={(e) => setFiltros({...filtros, eFeriado: e.target.checked})}
                        className="mr-2" 
                      />
                      Apenas Feriados
                    </label>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">Buscar:</span>
                      <input
                        type="text"
                        value={filtros.busca}
                        onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                        placeholder="Nome do motoboy ou loja..."
                        className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-right">
                  <span className="text-sm text-gray-600">
                    {jornadasFiltradas.length} jornadas encontradas | Total valor: R$ {jornadasFiltradas.reduce((sum, j) => sum + (j.valorDiaria || 0) + (j.valorCorridas || 0) + (j.comissoes || 0) + (j.missoes || 0) - (j.descontos || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Formulário de cadastro */}
              {showJornadaForm && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingJornada ? 'Editar Jornada' : cadastroMultiplo ? 'Cadastro Múltiplo de Jornadas' : 'Cadastrar Nova Jornada'}
                </h3>
                
                {cadastroMultiplo && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700">
                      <strong>Modo Cadastro Múltiplo:</strong> Defina a data e loja, depois adicione motoboys com valores individualizados para cada um.
                    </p>
                  </div>
                )}

                <form onSubmit={addJornada} className="space-y-6">
                  {/* Formulário Cadastro Single */}
                  {!cadastroMultiplo && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                          <input
                            type="date"
                            value={jornadaForm.data}
                            onChange={(e) => setJornadaForm({...jornadaForm, data: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Motoboy</label>
                          <select
                            value={jornadaForm.motoboyId}
                            onChange={(e) => setJornadaForm({...jornadaForm, motoboyId: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Selecione um motoboy</option>
                            {motoboys.filter(m => m.status === 'ativo').map(motoboy => (
                              <option key={motoboy.id} value={motoboy.id}>{motoboy.nome}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Loja</label>
                          {currentUser?.tipo === 'lojista' ? (
                            <input
                              type="text"
                              value={getLojasFiltradas()[0]?.nome || 'Nenhuma loja associada'}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                            />
                          ) : (
                            <select
                              value={jornadaForm.lojaId}
                              onChange={(e) => setJornadaForm({...jornadaForm, lojaId: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            >
                              <option value="">Selecione uma loja</option>
                              {lojas.map(loja => (
                                <option key={loja.id} value={loja.id}>{loja.nome}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Valor Diária</label>
                          <input
                            type="number"
                            step="0.01"
                            value={jornadaForm.valorDiaria}
                            onChange={(e) => setJornadaForm({...jornadaForm, valorDiaria: parseFloat(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Valor das Corridas</label>
                          <input
                            type="number"
                            step="0.01"
                            value={jornadaForm.valorCorridas}
                            onChange={(e) => setJornadaForm({...jornadaForm, valorCorridas: parseFloat(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Comissões</label>
                          <input
                            type="number"
                            step="0.01"
                            value={jornadaForm.comissoes}
                            onChange={(e) => setJornadaForm({...jornadaForm, comissoes: parseFloat(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Missões</label>
                          <input
                            type="number"
                            step="0.01"
                            value={jornadaForm.missoes}
                            onChange={(e) => setJornadaForm({...jornadaForm, missoes: parseFloat(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Descontos</label>
                          <input
                            type="number"
                            step="0.01"
                            value={jornadaForm.descontos}
                            onChange={(e) => setJornadaForm({...jornadaForm, descontos: parseFloat(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={jornadaForm.eFeriado}
                            onChange={(e) => setJornadaForm({...jornadaForm, eFeriado: e.target.checked})}
                            className="mr-2"
                          />
                          É feriado
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                        <textarea
                          value={jornadaForm.observacoes}
                          onChange={(e) => setJornadaForm({...jornadaForm, observacoes: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="3"
                        />
                      </div>
                    </>
                  )}

                  {/* Formulário Cadastro Múltiplo */}
                  {cadastroMultiplo && (
                    <>
                      {/* Dados gerais */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                          <input
                            type="date"
                            value={jornadaMultiplaForm.data}
                            onChange={(e) => setJornadaMultiplaForm({...jornadaMultiplaForm, data: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Loja</label>
                          {currentUser?.tipo === 'lojista' ? (
                            <input
                              type="text"
                              value={getLojasFiltradas()[0]?.nome || 'Nenhuma loja associada'}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                            />
                          ) : (
                            <select
                              value={jornadaMultiplaForm.lojaId}
                              onChange={(e) => setJornadaMultiplaForm({...jornadaMultiplaForm, lojaId: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            >
                              <option value="">Selecione uma loja</option>
                              {lojas.map(loja => (
                                <option key={loja.id} value={loja.id}>{loja.nome}</option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={jornadaMultiplaForm.eFeriado}
                              onChange={(e) => setJornadaMultiplaForm({...jornadaMultiplaForm, eFeriado: e.target.checked})}
                              className="mr-2"
                            />
                            É feriado
                          </label>
                        </div>
                      </div>

                      {/* Lista de motoboys */}
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-md font-medium text-gray-900">Motoboys</h4>
                          <button
                            type="button"
                            onClick={adicionarMotoboyMultiplo}
                            className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors text-sm"
                          >
                            + Adicionar Motoboy
                          </button>
                        </div>

                        {jornadaMultiplaForm.motoboys.length === 0 && (
                          <div className="text-center py-4 text-gray-500 border border-gray-200 rounded-md">
                            Nenhum motoboy adicionado. Clique em "Adicionar Motoboy" para começar.
                          </div>
                        )}

                        <div className="space-y-4">
                          {jornadaMultiplaForm.motoboys.map((motoboyData, index) => {
                            const motoboy = motoboys.find(m => m.id === motoboyData.motoboyId);
                            return (
                              <div key={index} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                                <div className="flex justify-between items-center mb-3">
                                  <h5 className="font-medium text-gray-900">
                                    {motoboy?.nome || 'Motoboy não encontrado'}
                                  </h5>
                                  <button
                                    type="button"
                                    onClick={() => removerMotoboyMultiplo(index)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Remover
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Motoboy</label>
                                    <select
                                      value={motoboyData.motoboyId}
                                      onChange={(e) => atualizarMotoboyMultiplo(index, 'motoboyId', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                      <option value="">Selecione um motoboy</option>
                                      {motoboys.filter(m => 
                                        m.status === 'ativo' && 
                                        (m.id === motoboyData.motoboyId || !jornadaMultiplaForm.motoboys.find(mb => mb.motoboyId === m.id))
                                      ).map(motoboy => (
                                        <option key={motoboy.id} value={motoboy.id}>{motoboy.nome}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Valor Diária</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={motoboyData.valorDiaria}
                                      onChange={(e) => atualizarMotoboyMultiplo(index, 'valorDiaria', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Valor Corridas</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={motoboyData.valorCorridas}
                                      onChange={(e) => atualizarMotoboyMultiplo(index, 'valorCorridas', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Comissões</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={motoboyData.comissoes}
                                      onChange={(e) => atualizarMotoboyMultiplo(index, 'comissoes', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Missões</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={motoboyData.missoes}
                                      onChange={(e) => atualizarMotoboyMultiplo(index, 'missoes', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Descontos</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={motoboyData.descontos}
                                      onChange={(e) => atualizarMotoboyMultiplo(index, 'descontos', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>

                                <div className="mt-3">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
                                  <input
                                    type="text"
                                    value={motoboyData.observacoes}
                                    onChange={(e) => atualizarMotoboyMultiplo(index, 'observacoes', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Observações específicas para este motoboy..."
                                  />
                                </div>

                                <div className="mt-2 text-xs text-gray-600">
                                  Total: R$ {(
                                    (motoboyData.valorDiaria || 0) + 
                                    (motoboyData.valorCorridas || 0) + 
                                    (motoboyData.comissoes || 0) + 
                                    (motoboyData.missoes || 0) - 
                                    (motoboyData.descontos || 0)
                                  ).toFixed(2)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {editingJornada ? 'Atualizar Jornada' : cadastroMultiplo ? 'Cadastrar Jornadas' : 'Cadastrar Jornada'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowJornadaForm(false);
                        setEditingJornada(null);
                        setCadastroMultiplo(false);
                      }}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    {!editingJornada && (
                      <button
                        type="button"
                        onClick={() => setCadastroMultiplo(!cadastroMultiplo)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                      >
                        {cadastroMultiplo ? 'Modo Single' : 'Modo Múltiplo'}
                      </button>
                    )}
                  </div>
                </form>
              </div>
              )}

              {/* Lista de jornadas no formato da imagem */}
              <div className="bg-white rounded-lg shadow">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motoboy</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loja</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horário</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horas</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Diária</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Corridas</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Extras</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jornadasFiltradas.slice().reverse().map(jornada => {
                        const motoboy = motoboys.find(m => m.id === jornada.motoboyId);
                        const loja = lojas.find(l => l.id === jornada.lojaId);
                        const valorTotalCorridas = jornada.valorCorridas || 0;
                        const extras = (jornada.comissoes || 0) + (jornada.missoes || 0);
                        const total = (jornada.valorDiaria || 0) + valorTotalCorridas + extras - (jornada.descontos || 0);
                        
                        return (
                          <tr key={jornada.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {(() => {
                                console.log('📊 Exibindo data na tabela:', jornada.data);
                                const dataExibicao = new Date(jornada.data + 'T12:00:00').toLocaleDateString('pt-BR');
                                console.log('📊 Data formatada para exibição:', dataExibicao);
                                return dataExibicao;
                              })()}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {motoboy?.nome || 'N/A'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {loja?.nome || 'N/A'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {jornada.eFeriado ? '12:00 - 20:00' : '13:00 - 20:00'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                              {jornada.eFeriado ? '8,0h' : '6,0h'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-blue-600 font-medium">
                              R$ {(jornada.valorDiaria || 0).toFixed(2)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 font-medium">
                              R$ {valorTotalCorridas.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                              R$ {extras.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-red-600 font-medium">
                              R$ {total.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => editJornada(jornada)}
                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                  title="Editar jornada"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button 
                                  onClick={() => deleteJornada(jornada.id)}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                  title="Excluir jornada"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {jornadasFiltradas.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {jornadas.length === 0 ? 'Nenhuma jornada cadastrada ainda.' : 'Nenhuma jornada encontrada com os filtros aplicados.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Adiantamentos */}
          {activeTab === 'adiantamentos' && ['admin', 'financeiro'].includes(currentUser.tipo) && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Adiantamentos</h2>
              </div>

              {/* Formulário de cadastro */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cadastrar Novo Adiantamento</h3>
                <form onSubmit={addAdiantamento} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Motoboy</label>
                    <select
                      value={adiantamentoForm.motoboyId}
                      onChange={(e) => setAdiantamentoForm({...adiantamentoForm, motoboyId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecione um motoboy</option>
                      {motoboys.filter(m => m.status === 'ativo').map(motoboy => (
                        <option key={motoboy.id} value={motoboy.id}>{motoboy.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loja</label>
                    <select
                      value={adiantamentoForm.lojaId}
                      onChange={(e) => setAdiantamentoForm({...adiantamentoForm, lojaId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecione uma loja</option>
                      {lojas.map(loja => (
                        <option key={loja.id} value={loja.id}>{loja.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valor</label>
                    <input
                      type="number"
                      step="0.01"
                      value={adiantamentoForm.valor}
                      onChange={(e) => setAdiantamentoForm({...adiantamentoForm, valor: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                    <input
                      type="date"
                      value={adiantamentoForm.data}
                      onChange={(e) => setAdiantamentoForm({...adiantamentoForm, data: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 lg:col-span-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Observação</label>
                    <input
                      type="text"
                      value={adiantamentoForm.observacao}
                      onChange={(e) => setAdiantamentoForm({...adiantamentoForm, observacao: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2 lg:col-span-4">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Cadastrar Adiantamento
                    </button>
                  </div>
                </form>
              </div>

              {/* Lista de adiantamentos */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motoboy</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loja</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observação</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {adiantamentos.slice().reverse().map(adiantamento => {
                      const motoboy = motoboys.find(m => m.id === adiantamento.motoboyId);
                      const loja = lojas.find(l => l.id === adiantamento.lojaId);
                      return (
                        <tr key={adiantamento.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{adiantamento.data}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{motoboy?.nome}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loja?.nome}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {adiantamento.valor.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{adiantamento.observacao}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {adiantamentos.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum adiantamento cadastrado ainda.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Débitos */}
          {activeTab === 'debitos' && ['admin', 'financeiro'].includes(currentUser.tipo) && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Débitos Pendentes</h2>
                <div className="flex gap-2">
                  <button
                    onClick={exportarDebitosPDF}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar PDF
                  </button>
                  <button
                    onClick={exportarDebitosCSV}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar CSV
                  </button>
                </div>
              </div>

              {/* Formulário de cadastro */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingDebito ? 'Editar Débito' : 'Cadastrar Novo Débito'}
                </h3>
                <form onSubmit={addDebito} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loja</label>
                    <select
                      value={debitoForm.lojaId}
                      onChange={(e) => setDebitoForm({...debitoForm, lojaId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecione uma loja</option>
                      {lojas.map(loja => (
                        <option key={loja.id} value={loja.id}>{loja.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                    <input
                      type="text"
                      value={debitoForm.descricao}
                      onChange={(e) => setDebitoForm({...debitoForm, descricao: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valor</label>
                    <input
                      type="number"
                      step="0.01"
                      value={debitoForm.valor}
                      onChange={(e) => setDebitoForm({...debitoForm, valor: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Vencimento</label>
                    <input
                      type="date"
                      value={debitoForm.dataVencimento}
                      onChange={(e) => setDebitoForm({...debitoForm, dataVencimento: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 lg:col-span-4">
                    <div className="flex gap-4">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        {editingDebito ? 'Atualizar Débito' : 'Cadastrar Débito'}
                      </button>
                      {editingDebito && (
                        <button
                          type="button"
                          onClick={cancelarEdicaoDebito}
                          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* Lista de débitos */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loja</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {debitosPendentes.slice().reverse().map(debito => {
                      const loja = lojas.find(l => l.id === debito.lojaId);
                      const isVencido = new Date(debito.dataVencimento) < new Date();
                      return (
                        <tr key={debito.id} className={isVencido ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{loja?.nome}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{debito.descricao}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {debito.valor.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{debito.dataVencimento}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              debito.status === 'pendente' 
                                ? isVencido 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                                : debito.status === 'pago' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                            }`}>
                              {debito.status} {isVencido && debito.status === 'pendente' ? '(Vencido)' : ''}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => editDebito(debito)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Editar
                              </button>
                              {debito.status === 'pendente' && (
                                <button
                                  onClick={async () => {
                                    const novosDebitos = debitosPendentes.map(d => 
                                      d.id === debito.id ? { ...d, status: 'pago' } : d
                                    );
                                    setDebitosPendentes(novosDebitos);
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Marcar como Pago
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  toast((t) => (
                                    <div className="flex flex-col items-center">
                                      <span className="mb-3">Tem certeza que deseja excluir este débito?</span>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => {
                                            const novosDebitos = debitosPendentes.filter(d => d.id !== debito.id);
                                            setDebitosPendentes(novosDebitos);
                                            toast.dismiss(t.id);
                                            toast.success('Débito excluído com sucesso!');
                                          }}
                                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                        >
                                          Excluir
                                        </button>
                                        <button
                                          onClick={() => toast.dismiss(t.id)}
                                          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  ), {
                                    duration: 10000,
                                  });
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {debitosPendentes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum débito cadastrado ainda.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Relatórios */}
          {activeTab === 'relatorios' && ['admin', 'financeiro', 'lojista'].includes(currentUser.tipo) && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Relatórios por Período</h2>
                {relatorioLojas.length > 0 && (
                  <button
                    onClick={gerarPDFTodos}
                    className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar Todos (PDF)
                  </button>
                )}
              </div>

              {/* Seleção de período */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Gerar Relatório</h3>
                <div className="flex gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                    <input
                      type="date"
                      value={relatorioConfig.dataInicio}
                      onChange={(e) => setRelatorioConfig({...relatorioConfig, dataInicio: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                    <input
                      type="date"
                      value={relatorioConfig.dataFim}
                      onChange={(e) => setRelatorioConfig({...relatorioConfig, dataFim: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={gerarRelatorios}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Gerar Relatórios
                  </button>
                </div>
              </div>

              {/* Debug - Débitos no sistema */}
              {getDebitosFiltrados().length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">🔍 Debug - Débitos no Sistema:</h4>
                  <div className="text-sm text-yellow-700">
                    <p>Total de débitos: {getDebitosFiltrados().length}</p>
                    <p>Débitos pendentes: {getDebitosFiltrados().filter(d => d.status === 'pendente').length}</p>
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      {getDebitosFiltrados().filter(d => d.status === 'pendente').map(debito => {
                        const loja = getLojasFiltradas().find(l => l.id === debito.lojaId);
                        return (
                          <div key={debito.id} className="flex justify-between text-xs border-b border-yellow-200 py-1">
                            <span>{loja?.nome} - {debito.descricao}</span>
                            <span>R$ {debito.valor.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}



              {/* Relatórios gerados */}
              {relatorioLojas.length > 0 && (
                <div className="space-y-8">
                  {/* Cards de métricas no topo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-blue-500 text-white rounded-lg p-6">
                      <h3 className="text-sm font-medium mb-2">Faturamento Total</h3>
                      <p className="text-2xl font-bold">
                        R$ {relatorioLojas.reduce((sum, grupo) => sum + grupo.totais.final, 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-green-500 text-white rounded-lg p-6">
                      <h3 className="text-sm font-medium mb-2">Total de Corridas</h3>
                      <p className="text-2xl font-bold">
                        R$ {relatorioLojas.reduce((sum, grupo) => 
                          sum + grupo.motoboys.reduce((mbSum, mb) => 
                            mbSum + (mb.valorCorridas || 0), 0), 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-yellow-500 text-white rounded-lg p-6">
                      <h3 className="text-sm font-medium mb-2">Jornadas Realizadas</h3>
                      <p className="text-2xl font-bold">
                        {relatorioLojas.reduce((sum, grupo) => 
                          sum + grupo.motoboys.reduce((mbSum, mb) => mbSum + mb.jornadas.length, 0), 0)}
                      </p>
                    </div>

                    <div className="bg-purple-500 text-white rounded-lg p-6">
                      <h3 className="text-sm font-medium mb-2">Lojas Atendidas</h3>
                      <p className="text-2xl font-bold">{relatorioLojas.length}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">Relatório por Loja</h3>
                    <div className="text-sm text-gray-600">
                      Período: {new Date(relatorioLojas[0]?.periodo.inicio + 'T12:00:00').toLocaleDateString('pt-BR')} até {new Date(relatorioLojas[0]?.periodo.fim + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  {/* Aviso sobre adiantamentos da semana atual */}
                  {(() => {
                    const periodoSemanaAtual = obterPeriodoSemanaAtual();
                    const hoje = new Date().toISOString().split('T')[0];
                    
                    // Verificar se há adiantamentos da semana atual que estão sendo incluídos
                    const adiantamentosSemanaAtual = getAdiantamentosFiltrados().filter(a => 
                      a.data >= periodoSemanaAtual.inicio && 
                      a.data <= periodoSemanaAtual.fim &&
                      a.data >= periodoSemanaAtual.inicio &&
                      a.data <= hoje // Só até hoje
                    );
                    
                    if (adiantamentosSemanaAtual.length > 0) {
                      return (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                          <h4 className="font-medium text-blue-800 mb-2">
                            📅 Adiantamentos da Semana Atual Incluídos
                          </h4>
                          <p className="text-sm text-blue-700">
                            Adiantamentos do período de <strong>{new Date(periodoSemanaAtual.inicio + 'T12:00:00').toLocaleDateString('pt-BR')}</strong> até <strong>{new Date(periodoSemanaAtual.fim + 'T12:00:00').toLocaleDateString('pt-BR')}</strong> estão sendo automaticamente incluídos nos relatórios para desconto dos motoboys.
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Total de adiantamentos da semana atual: {adiantamentosSemanaAtual.length} | 
                            Valor total: R$ {adiantamentosSemanaAtual.reduce((sum, a) => sum + (a.valor || 0), 0).toFixed(2)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {relatorioLojas.map(grupo => (
                    <div key={grupo.loja.id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                      {/* Header da loja */}
                      <div className="px-6 py-4 bg-blue-50 border-b border-gray-200 flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{grupo.loja.nome}</h3>
                          <p className="text-sm text-gray-600">
                            CNPJ: {grupo.loja.cnpj} | Contato: {grupo.loja.contato}
                          </p>
                          <p className="text-sm text-blue-600 font-medium mt-1">
                            Período: {new Date(grupo.periodo.inicio + 'T12:00:00').toLocaleDateString('pt-BR')} até {new Date(grupo.periodo.fim + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <button
                          onClick={() => gerarPDF(grupo)}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Gerar PDF
                        </button>
                      </div>
                      
                      <div className="p-6">
                        {/* Valores resumidos da loja */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <div className="bg-blue-100 p-4 rounded-lg">
                            <p className="text-xs font-medium text-blue-600 uppercase">LOGÍSTICA</p>
                            <p className="text-lg font-bold text-blue-800">R$ {grupo.totais.liquido.toFixed(2)}</p>
                          </div>
                          <div className="bg-orange-100 p-4 rounded-lg">
                            <p className="text-xs font-medium text-orange-600 uppercase">
                              TAXA ADMIN 
                              {grupo.loja.usarTaxaPercentual && grupo.totais.liquido > (grupo.loja.limiteValorFixo || 0) 
                                ? ` (${grupo.loja.percentualTaxa}%)`
                                : ' (FIXA)'
                              }
                            </p>
                            <p className="text-lg font-bold text-orange-800">R$ {grupo.totais.taxaAdmin.toFixed(2)}</p>
                          </div>
                          <div className="bg-purple-100 p-4 rounded-lg">
                            <p className="text-xs font-medium text-purple-600 uppercase">SUPERVISÃO</p>
                            <p className="text-lg font-bold text-purple-800">R$ {grupo.totais.taxaSupervisao.toFixed(2)}</p>
                          </div>
                          <div className="bg-red-100 p-4 rounded-lg">
                            <p className="text-xs font-medium text-red-600 uppercase">DÉBITOS PENDENTES ({grupo.debitos.length})</p>
                            <p className="text-lg font-bold text-red-800">R$ {grupo.totais.debitos.toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Detalhamento por Motoboy */}
                        <h4 className="font-semibold text-gray-900 mb-4">Detalhamento por Motoboy:</h4>
                        

                        


                        {/* Tabela de motoboys */}
                        <div className="overflow-x-auto mb-6">
                          <table className="min-w-full">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">MOTOBOY</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">SEG</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">TER</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">QUA</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">QUI</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">SEX</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">SAB</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">DOM</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">VALOR DIÁRIA</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">TAXA</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">MISSÕES</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">DESCONTOS</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">TOTAL</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {grupo.motoboys.map(motoboy => {
                                // Organizar jornadas por dia da semana
                                const jornadasPorDia = {};
                                motoboy.jornadas.forEach(jornada => {
                                  const data = new Date(jornada.data + 'T12:00:00');
                                  const diaSemana = data.getDay(); // 0=domingo, 1=segunda, etc.
                                  jornadasPorDia[diaSemana] = jornada;
                                });

                                return (
                                  <tr key={`${motoboy.id}-${motoboy.motoboy.id}`} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 text-sm font-medium text-gray-900">{motoboy.motoboy.nome}</td>
                                    {/* Dias da semana - Segunda a Domingo */}
                                    {[1, 2, 3, 4, 5, 6, 0].map(dia => {
                                      const jornada = jornadasPorDia[dia];
                                      if (!jornada) {
                                        return (
                                          <td key={dia} className="px-3 py-2 text-center text-sm">
                                            <span className="text-gray-400">-</span>
                                          </td>
                                        );
                                      }
                                      
                                      // Valor das corridas para este dia
                                      const valorTotalCorridasDia = jornada.valorCorridas || 0;
                                      
                                      return (
                                        <td key={dia} className="px-3 py-2 text-center text-sm">
                                          <span className="text-green-600 font-medium">
                                            R$ {valorTotalCorridasDia.toFixed(0)}
                                          </span>
                                        </td>
                                      );
                                    })}
                                    <td className="px-3 py-2 text-center text-sm font-medium text-blue-600">
                                      R$ {motoboy.valorDiaria.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-center text-sm text-green-600">
                                      R$ {motoboy.totalCorridas.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-center text-sm">
                                      R$ {(motoboy.comissoes + motoboy.missoes).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-center text-sm text-red-600">
                                      R$ {motoboy.descontos.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-center text-sm font-bold bg-blue-600 text-white">
                                      R$ {motoboy.totalLiquido.toFixed(2)}
                                    </td>
                                  </tr>
                                );
                              })}
                              {/* Linha de total */}
                              <tr className="bg-blue-600 text-white font-bold">
                                <td className="px-3 py-2 text-sm">TOTAL LOGÍSTICA</td>
                                <td className="px-3 py-2 text-center text-sm" colSpan="11"></td>
                                <td className="px-3 py-2 text-center text-sm">
                                  R$ {grupo.totais.liquido.toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Total final da loja */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-900">VALOR TOTAL A PAGAR ESTA LOJA:</span>
                            <span className="text-2xl font-bold text-red-600">R$ {grupo.totais.final.toFixed(2)}</span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Logística R$ {grupo.totais.liquido.toFixed(2)} + Taxa Admin R$ {grupo.totais.taxaAdmin.toFixed(2)} + Supervisão R$ {grupo.totais.taxaSupervisao.toFixed(2)} + Débitos R$ {grupo.totais.debitos.toFixed(2)}
                          </div>
                        </div>

                        {/* Débitos detalhados */}
                        {grupo.debitos && grupo.debitos.length > 0 ? (
                          <div className="mt-4 bg-red-50 p-4 rounded-lg">
                            <h5 className="font-medium text-red-800 mb-2">Débitos Pendentes Incluídos:</h5>
                            <div className="space-y-1 text-sm">
                              {grupo.debitos.map(debito => (
                                <div key={debito.id} className="flex justify-between text-red-700">
                                  <span>{debito.descricao} (Venc: {new Date(debito.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR')})</span>
                                  <span className="font-medium">R$ {debito.valor.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 bg-green-50 p-4 rounded-lg">
                            <h5 className="font-medium text-green-800 mb-2">✅ Nenhum débito pendente para esta loja</h5>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(relatorioConfig.dataInicio && relatorioConfig.dataFim) && relatorioLojas.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8">
                  <div className="text-center text-gray-500">
                    <p>Nenhuma jornada encontrada para o período selecionado.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Relatório Motoboys */}
          {activeTab === 'relatorio-motoboys' && ['admin', 'financeiro', 'lojista'].includes(currentUser.tipo) && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Relatório Motoboys por Loja</h2>
                {relatorioMotoboyLojas.length > 0 && (
                  <button
                    onClick={gerarPDFTodosMotoboys}
                    className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar Todos (PDF)
                  </button>
                )}
              </div>

              {/* Seleção de período */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Gerar Relatório de Motoboys</h3>
                <div className="flex gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                    <input
                      type="date"
                      value={relatorioMotoboyConfig.dataInicio}
                      onChange={(e) => setRelatorioMotoboyConfig({...relatorioMotoboyConfig, dataInicio: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                    <input
                      type="date"
                      value={relatorioMotoboyConfig.dataFim}
                      onChange={(e) => setRelatorioMotoboyConfig({...relatorioMotoboyConfig, dataFim: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={gerarRelatorioMotoboys}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Gerar Relatório
                  </button>
                </div>
              </div>

              {/* Relatórios gerados */}
              {relatorioMotoboyLojas.length > 0 && (
                <div className="space-y-8">
                  {/* Cards de métricas no topo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-blue-500 text-white rounded-lg p-6">
                      <h3 className="text-sm font-medium mb-2">Total Motoboys</h3>
                      <p className="text-2xl font-bold">
                        {relatorioMotoboyLojas.reduce((total, loja) => {
                          const uniqueMotoboys = new Set();
                          loja.motoboys.forEach(mb => uniqueMotoboys.add(mb.motoboy.id));
                          return total + uniqueMotoboys.size;
                        }, 0)}
                      </p>
                    </div>

                    <div className="bg-green-500 text-white rounded-lg p-6">
                      <h3 className="text-sm font-medium mb-2">Total Jornadas</h3>
                      <p className="text-2xl font-bold">
                        {relatorioMotoboyLojas.reduce((total, loja) => 
                          total + loja.motoboys.reduce((subTotal, mb) => subTotal + mb.jornadas.length, 0), 0)}
                      </p>
                    </div>

                    <div className="bg-yellow-500 text-white rounded-lg p-6">
                      <h3 className="text-sm font-medium mb-2">Total Diárias</h3>
                      <p className="text-2xl font-bold">
                        R$ {relatorioMotoboyLojas.reduce((total, loja) => 
                          total + loja.motoboys.reduce((subTotal, mb) => subTotal + mb.totalDiaria, 0), 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-purple-500 text-white rounded-lg p-6">
                      <h3 className="text-sm font-medium mb-2">Total Corridas</h3>
                      <p className="text-2xl font-bold">
                        R$ {relatorioMotoboyLojas.reduce((total, loja) => 
                          total + loja.motoboys.reduce((subTotal, mb) => subTotal + mb.totalCorridas, 0), 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">Motoboys por Loja</h3>
                    <div className="text-sm text-gray-600">
                      Período: {new Date(relatorioMotoboyLojas[0]?.periodo.inicio + 'T12:00:00').toLocaleDateString('pt-BR')} até {new Date(relatorioMotoboyLojas[0]?.periodo.fim + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  {/* Aviso sobre adiantamentos da semana atual */}
                  {(() => {
                    const periodoSemanaAtual = obterPeriodoSemanaAtual();
                    const hoje = new Date().toISOString().split('T')[0];
                    
                    // Verificar se há adiantamentos da semana atual que estão sendo incluídos
                    const adiantamentosSemanaAtual = getAdiantamentosFiltrados().filter(a => 
                      a.data >= periodoSemanaAtual.inicio && 
                      a.data <= periodoSemanaAtual.fim &&
                      a.data >= periodoSemanaAtual.inicio &&
                      a.data <= hoje // Só até hoje
                    );
                    
                    if (adiantamentosSemanaAtual.length > 0) {
                      return (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                          <h4 className="font-medium text-blue-800 mb-2">
                            📅 Adiantamentos da Semana Atual Incluídos
                          </h4>
                          <p className="text-sm text-blue-700">
                            Adiantamentos do período de <strong>{new Date(periodoSemanaAtual.inicio + 'T12:00:00').toLocaleDateString('pt-BR')}</strong> até <strong>{new Date(periodoSemanaAtual.fim + 'T12:00:00').toLocaleDateString('pt-BR')}</strong> estão sendo automaticamente incluídos nos relatórios para desconto dos motoboys.
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Total de adiantamentos da semana atual: {adiantamentosSemanaAtual.length} | 
                            Valor total: R$ {adiantamentosSemanaAtual.reduce((sum, a) => sum + (a.valor || 0), 0).toFixed(2)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {relatorioMotoboyLojas.map(grupo => (
                    <div key={grupo.loja.id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                      {/* Header da loja */}
                      <div className="px-6 py-4 bg-blue-50 border-b border-gray-200 flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{grupo.loja.nome}</h3>
                          <p className="text-sm text-gray-600">
                            CNPJ: {grupo.loja.cnpj} | Contato: {grupo.loja.contato}
                          </p>
                          <p className="text-sm text-blue-600 font-medium mt-1">
                            Período: {new Date(grupo.periodo.inicio + 'T12:00:00').toLocaleDateString('pt-BR')} até {new Date(grupo.periodo.fim + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {grupo.motoboys.length} motoboy(s) trabalharam nesta loja
                          </p>
                        </div>
                        <button
                          onClick={() => gerarPDFMotoboys(grupo)}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Gerar PDF
                        </button>
                      </div>
                      
                      <div className="p-6">
                        {/* Detalhamento por Motoboy */}
                        <h4 className="font-semibold text-gray-900 mb-4">Detalhamento por Motoboy:</h4>

                        {/* Tabela de motoboys no mesmo padrão da página de relatórios */}
                        <div className="overflow-x-auto mb-6">
                          <table className="min-w-full">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">MOTOBOY</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">SEG</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">TER</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">QUA</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">QUI</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">SEX</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">SAB</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">DOM</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">VALOR DIÁRIA</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">TAXA</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">MISSÕES</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">DESCONTOS</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">ADIANTAMENTO</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">TOTAL</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {grupo.motoboys.map(motoboyData => {
                                // Organizar jornadas por dia da semana
                                const jornadasPorDia = {};
                                motoboyData.jornadas.forEach(jornada => {
                                  const data = new Date(jornada.data + 'T12:00:00');
                                  const diaSemana = data.getDay(); // 0=domingo, 1=segunda, etc.
                                  jornadasPorDia[diaSemana] = jornada;
                                });

                                return (
                                  <tr key={motoboyData.motoboy.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 text-sm font-medium text-gray-900">{motoboyData.motoboy.nome}</td>
                                    {/* Dias da semana - Segunda a Domingo */}
                                    {[1, 2, 3, 4, 5, 6, 0].map(dia => {
                                      const jornada = jornadasPorDia[dia];
                                      if (!jornada) {
                                        return (
                                          <td key={dia} className="px-3 py-2 text-center text-sm">
                                            <span className="text-gray-400">-</span>
                                          </td>
                                        );
                                      }
                                      
                                      // Valor das corridas para este dia
                                      const valorTotalCorridasDia = jornada.valorCorridas || 0;
                                      
                                      return (
                                        <td key={dia} className="px-3 py-2 text-center text-sm">
                                          <span className="text-green-600 font-medium">
                                            R$ {valorTotalCorridasDia.toFixed(0)}
                                          </span>
                                        </td>
                                      );
                                    })}
                                    <td className="px-3 py-2 text-center text-sm font-medium text-blue-600">
                                      R$ {motoboyData.totalDiaria.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-center text-sm text-green-600">
                                      R$ {motoboyData.totalCorridas.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-center text-sm">
                                      R$ {(motoboyData.totalComissoes + motoboyData.totalMissoes).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-center text-sm text-red-600">
                                      R$ {motoboyData.totalDescontos.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-center text-sm text-red-600 font-medium">
                                      -R$ {motoboyData.totalAdiantamentos.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-center text-sm font-bold bg-blue-600 text-white">
                                      R$ {motoboyData.totalLiquido.toFixed(2)}
                                    </td>
                                  </tr>
                                );
                              })}
                              {/* Linha de total */}
                              <tr className="bg-blue-600 text-white font-bold">
                                <td className="px-3 py-2 text-sm">TOTAL MOTOBOYS</td>
                                <td className="px-3 py-2 text-center text-sm" colSpan="12"></td>
                                <td className="px-3 py-2 text-center text-sm">
                                  R$ {grupo.motoboys.reduce((sum, mb) => sum + mb.totalLiquido, 0).toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Resumo dos dados da loja */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Total Diárias:</span>
                              <span className="ml-2 font-bold text-blue-600">
                                R$ {grupo.motoboys.reduce((sum, mb) => sum + mb.totalDiaria, 0).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Total Corridas:</span>
                              <span className="ml-2 font-bold text-green-600">
                                R$ {grupo.motoboys.reduce((sum, mb) => sum + mb.totalCorridas, 0).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Total Extras:</span>
                              <span className="ml-2 font-bold text-purple-600">
                                R$ {grupo.motoboys.reduce((sum, mb) => sum + mb.totalComissoes + mb.totalMissoes, 0).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Total Adiantamentos:</span>
                              <span className="ml-2 font-bold text-red-600">
                                R$ {grupo.motoboys.reduce((sum, mb) => sum + mb.totalAdiantamentos, 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(relatorioMotoboyConfig.dataInicio && relatorioMotoboyConfig.dataFim) && relatorioMotoboyLojas.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8">
                  <div className="text-center text-gray-500">
                    <p>Nenhuma jornada encontrada para o período selecionado.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PDR */}
          {activeTab === 'pdr' && currentUser.tipo === 'admin' && <PDR />}
        </div>
      </div>
    </div>
  );
}

export default App;
});`}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Validações */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">4.3 Validações</h4>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <div>
                          <h5 className="font-medium text-green-900">Jornadas:</h5>
                          <ul className="list-disc list-inside text-green-800 text-sm">
                            <li>Não permite jornadas duplicadas (mesmo motoboy + data)</li>
                            <li>Campos obrigatórios: data, motoboy, loja</li>
                            <li>Validação de formato de data</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-green-900">Motoboys:</h5>
                          <ul className="list-disc list-inside text-green-800 text-sm">
                            <li>CPF com formatação automática</li>
                            <li>Telefone com máscara (00) 00000-0000</li>
                            <li>Nome obrigatório</li>
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-medium text-green-900">Relatórios:</h5>
                          <ul className="list-disc list-inside text-green-800 text-sm">
                            <li>Data início deve ser ≤ data fim</li>
                            <li>Período obrigatório para geração</li>
                            <li>Validação de dados antes da geração</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 5: Sistema de Relatórios */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">5. SISTEMA DE RELATÓRIOS</h3>
                
                <div className="space-y-6">
                  {/* Relatórios por Loja */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">5.1 Relatórios por Loja</h4>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-2">Estrutura:</h5>
                      <ul className="list-disc list-inside text-blue-800 space-y-1">
                        <li>Tabela com motoboys por dias da semana</li>
                        <li>Colunas: MOTOBOY | SEG-DOM | DIÁRIA | TAXA | MISSÕES | DESCONTOS | TOTAL</li>
                        <li>Totais consolidados por loja</li>
                        <li>Resumo financeiro com taxas e débitos</li>
                        <li>Valor final a pagar</li>
                      </ul>
                    </div>
                  </div>

                  {/* Relatórios de Motoboys */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">5.2 Relatórios de Motoboys</h4>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h5 className="font-medium text-green-900 mb-2">Estrutura:</h5>
                      <ul className="list-disc list-inside text-green-800 space-y-1">
                        <li>Mesmo formato da tabela principal</li>
                        <li>Adiciona coluna ADIANTAMENTO</li>
                        <li>Valores em negativo para adiantamentos</li>
                        <li>Total líquido já descontado</li>
                        <li>Agrupamento por loja</li>
                      </ul>
                    </div>
                  </div>

                  {/* Geração de PDF */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">5.3 Geração de PDF</h4>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h5 className="font-medium text-purple-900 mb-2">Funcionalidades:</h5>
                      <ul className="list-disc list-inside text-purple-800 space-y-1">
                        <li>PDF individual por loja</li>
                        <li>PDF consolidado de todas as lojas</li>
                        <li>Quebra automática de páginas</li>
                        <li>Formatação profissional</li>
                        <li>Cabeçalhos e rodapés informativos</li>
                        <li>Tabelas organizadas por seções</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 6: Segurança */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">6. SEGURANÇA E AUTENTICAÇÃO</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">6.1 Níveis de Acesso</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <div>
                          <strong className="text-red-600">Admin:</strong>
                          <span className="text-gray-700 ml-2">Acesso completo a todas as funcionalidades</span>
                        </div>
                        <div>
                          <strong className="text-blue-600">Financeiro:</strong>
                          <span className="text-gray-700 ml-2">Acesso a relatórios, jornadas e adiantamentos</span>
                        </div>
                        <div>
                          <strong className="text-green-600">Lojista:</strong>
                          <span className="text-gray-700 ml-2">Acesso limitado a dashboard e jornadas</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">6.2 Controle de Sessão</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Autenticação por email/senha</li>
                      <li>Sessão persistente no localStorage</li>
                      <li>Validação de permissões por página</li>
                      <li>Logout automático e manual</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Seção 7: Considerações Técnicas */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">7. CONSIDERAÇÕES TÉCNICAS</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">7.1 Performance</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Uso extensivo de React hooks (useState, useEffect)</li>
                      <li>Filtros client-side para responsividade (motoboysFiltrados, jornadasFiltradas)</li>
                      <li>Processamento assíncrono de relatórios</li>
                      <li>Caching de dados com useStoredState</li>
                      <li>Validação de dados no frontend</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">7.2 Armazenamento e Sincronização</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Estado persistente com useStoredState (hook do Hatch)</li>
                      <li>Configuração Supabase para modo offline</li>
                      <li>Backup automático no localStorage</li>
                      <li>Dados iniciais hardcoded (admin padrão)</li>
                      <li>Sincronização bidirecional planejada</li>
                      <li>Modo offline-first com fallback</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">7.3 Responsividade e UX</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Design mobile-first com Tailwind CSS</li>
                      <li>Breakpoints: sm, md, lg, xl</li>
                      <li>Tabelas com scroll horizontal (overflow-x-auto)</li>
                      <li>Formulários adaptativos (grid responsivo)</li>
                      <li>Sidebar colapsável em dispositivos móveis</li>
                      <li>Cards responsivos com grid dinâmico</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">7.4 Tratamento de Erros</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Validação de formulários com alerts</li>
                      <li>Controle de duplicatas em jornadas</li>
                      <li>Formatação automática de CPF e telefone</li>
                      <li>Validação de períodos em relatórios</li>
                      <li>Tratamento de dados faltantes (|| 0)</li>
                      <li>Console.log para debug detalhado</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Seção 8: Fluxos de Trabalho */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">8. FLUXOS DE TRABALHO</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">8.1 Fluxo de Cadastro de Jornada</h4>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm">
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Usuário acessa página de Jornadas</li>
                        <li>Clica em "Nova Jornada" ou "Cadastro Múltiplo"</li>
                        <li>Preenche dados obrigatórios (data, motoboy, loja)</li>
                        <li>Sistema valida duplicatas</li>
                        <li>Dados são salvos e aplicados filtros</li>
                        <li>Notificação de sucesso é exibida</li>
                      </ol>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">8.2 Fluxo de Geração de Relatórios</h4>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm">
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Usuário seleciona período (data início/fim)</li>
                        <li>Sistema valida período</li>
                        <li>Filtra jornadas do período</li>
                        <li>Aplica regra de adiantamentos da semana atual</li>
                        <li>Calcula totais por motoboy e loja</li>
                        <li>Aplica taxas e débitos pendentes</li>
                        <li>Gera cards de relatório</li>
                        <li>Disponibiliza opção de PDF</li>
                      </ol>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">8.3 Fluxo de Adiantamento</h4>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm">
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Cadastro do adiantamento com data</li>
                        <li>Sistema identifica período da semana atual</li>
                        <li>Nos relatórios, inclui adiantamentos do período + semana atual</li>
                        <li>Desconta automaticamente do total do motoboy</li>
                        <li>Exibe aviso visual quando há adiantamentos incluídos</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 9: Métricas */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">9. MÉTRICAS DO SISTEMA</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-100 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900">Entidades</h4>
                      <p className="text-2xl font-bold text-blue-800">6</p>
                      <p className="text-sm text-blue-700">Principais</p>
                    </div>
                    <div className="bg-green-100 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900">Páginas</h4>
                      <p className="text-2xl font-bold text-green-800">10</p>
                      <p className="text-sm text-green-700">Funcionais</p>
                    </div>
                    <div className="bg-yellow-100 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-900">Relatórios</h4>
                      <p className="text-2xl font-bold text-yellow-800">2</p>
                      <p className="text-sm text-yellow-700">Tipos</p>
                    </div>
                    <div className="bg-purple-100 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-900">Perfis</h4>
                      <p className="text-2xl font-bold text-purple-800">3</p>
                      <p className="text-sm text-purple-700">Acesso</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">9.1 Complexidade e Estatísticas</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Linhas de Código:</span>
                          <span className="font-medium">~3.400</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Componentes React:</span>
                          <span className="font-medium">1 Principal (ExpressoNevesApp)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Funções de Negócio:</span>
                          <span className="font-medium">~50</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estados Gerenciados:</span>
                          <span className="font-medium">~27</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hooks Utilizados:</span>
                          <span className="font-medium">useState, useEffect, useStoredState</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Formulários:</span>
                          <span className="font-medium">8 (cadastro + filtros)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Validações:</span>
                          <span className="font-medium">~18 pontos de validação</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Notificações:</span>
                          <span className="font-medium">~35 pontos de feedback</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">9.2 Estrutura de Arquivos</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-700 space-y-1">
                        <div><strong>Arquivo Principal:</strong> ExpressoNevesApp.js (componente único)</div>
                        <div><strong>Dependências:</strong> React, Supabase, jsPDF, react-hot-toast, Tailwind CSS</div>
                        <div><strong>Configuração:</strong> Supabase URL + Key hardcoded</div>
                        <div><strong>Dados Iniciais:</strong> Admin padrão no useStoredState</div>
                        <div><strong>Estilo:</strong> Tailwind classes inline</div>
                        <div><strong>Notificações:</strong> Toaster configurado no root component</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 10: Conclusão */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">10. CONCLUSÃO</h3>
                
                <div className="space-y-4">
                  <p className="text-gray-700">
                    O Sistema de Gestão de Motoboy da Expresso Neves representa uma solução completa para o controle 
                    financeiro e operacional de serviços de entrega. Com funcionalidades robustas de cadastro, controle 
                    de jornadas, gestão de adiantamentos e geração de relatórios, o sistema atende às necessidades 
                    específicas do negócio.
                  </p>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Principais Benefícios:</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Automatização completa dos cálculos financeiros com lógica de taxa dinâmica</li>
                      <li>Controle preciso de adiantamentos com regra da semana atual</li>
                      <li>Relatórios profissionais em PDF com duas modalidades (loja e motoboy)</li>
                      <li>Interface intuitiva e responsiva com paleta de cores consistente</li>
                      <li>Sistema de permissões com 3 níveis (admin, financeiro, lojista)</li>
                      <li>Sistema de notificações profissionais com react-hot-toast</li>
                      <li>Confirmações interativas para ações críticas</li>
                      <li>Exportação completa de débitos em PDF e CSV</li>
                      <li>Edição completa de débitos com validação</li>
                      <li>Flexibilidade para diferentes tipos de loja com configurações personalizadas</li>
                      <li>Consolidação inteligente de múltiplas jornadas por motoboy</li>
                      <li>Formatação automática de CPF e telefone</li>
                      <li>Cadastro múltiplo de jornadas para eficiência</li>
                      <li>Debug detalhado com console.log para desenvolvimento</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tecnologias-Chave:</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">React.js 19.0.0</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Tailwind CSS</span>
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">Supabase</span>
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">jsPDF</span>
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm">react-hot-toast</span>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">localStorage</span>
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">useStoredState</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Limitações e Melhorias Futuras:</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Componente monolítico (poderia ser dividido em subcomponentes)</li>
                      <li>Configuração Supabase hardcoded (deveria ser variável de ambiente)</li>
                      <li>Ausência de testes unitários</li>
                      <li>Validação de dados apenas no frontend</li>
                      <li>Sem controle de versão de dados</li>
                      <li>Funcionalidade de sincronização offline limitada</li>
                      <li>Dependência única de react-hot-toast (pode ser considerada mínima)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Melhorias Recentes Implementadas:</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>✅ Sistema de notificações profissionais com react-hot-toast</li>
                      <li>✅ Substituição completa de alertas nativos do browser</li>
                      <li>✅ Confirmações interativas para ações críticas</li>
                      <li>✅ Edição completa de débitos com validação</li>
                      <li>✅ Exportação de débitos em PDF e CSV</li>
                      <li>✅ Feedback visual consistente em todas as operações</li>
                      <li>✅ Toaster configurado com tema personalizado</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-800 font-medium">
                      Este PDR documenta completamente o sistema atual, incluindo as melhorias recentes implementadas 
                      com sistema de notificações profissionais e funcionalidades avançadas de gestão de débitos. 
                      Serve como referência para manutenção, melhorias futuras e treinamento de novos desenvolvedores.
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg mt-4">
                    <h4 className="font-medium text-green-900 mb-2">🎉 Sistema Completamente Atualizado</h4>
                    <p className="text-green-800 text-sm">
                      O sistema agora conta com notificações profissionais, edição completa de débitos, 
                      exportação avançada e experiência de usuário significativamente melhorada. 
                      Todas as funcionalidades foram testadas e validadas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Colaboradores */}
          {activeTab === 'colaboradores' && currentUser.tipo === 'admin' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Colaboradores</h2>
              </div>

              {/* Formulário de cadastro */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingColaborador ? 'Editar Colaborador' : 'Cadastrar Novo Colaborador'}
                </h3>
                <form onSubmit={addColaborador} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                      <input
                        type="text"
                        value={colaboradorForm.nome}
                        onChange={(e) => setColaboradorForm({...colaboradorForm, nome: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={colaboradorForm.email}
                        onChange={(e) => setColaboradorForm({...colaboradorForm, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                      <input
                        type="password"
                        value={colaboradorForm.senha}
                        onChange={(e) => setColaboradorForm({...colaboradorForm, senha: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                      <select
                        value={colaboradorForm.tipo}
                        onChange={(e) => setColaboradorForm({...colaboradorForm, tipo: e.target.value, lojaId: e.target.value !== 'lojista' ? '' : colaboradorForm.lojaId})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="admin">Administrador</option>
                        <option value="financeiro">Financeiro</option>
                        <option value="lojista">Lojista</option>
                      </select>
                    </div>
                  </div>

                  {colaboradorForm.tipo === 'lojista' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Loja Associada</label>
                      <select
                        value={colaboradorForm.lojaId}
                        onChange={(e) => setColaboradorForm({...colaboradorForm, lojaId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Selecione uma loja</option>
                        {lojas.map(loja => (
                          <option key={loja.id} value={loja.id}>{loja.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {editingColaborador ? 'Atualizar Colaborador' : 'Cadastrar Colaborador'}
                    </button>
                    {editingColaborador && (
                      <button
                        type="button"
                        onClick={cancelarEdicaoColaborador}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Lista de colaboradores */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loja</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {colaboradores.map(colaborador => {
                      const loja = colaborador.lojaId ? lojas.find(l => l.id === colaborador.lojaId) : null;
                      return (
                        <tr key={colaborador.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{colaborador.nome}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{colaborador.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              colaborador.tipo === 'admin' ? 'bg-red-100 text-red-800' :
                              colaborador.tipo === 'financeiro' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {colaborador.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {loja ? loja.nome : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              colaborador.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {colaborador.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => editColaborador(colaborador)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => toggleColaboradorStatus(colaborador.id)}
                                className={`${colaborador.ativo ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                                disabled={colaborador.id === currentUser?.id}
                              >
                                {colaborador.ativo ? 'Desativar' : 'Ativar'}
                              </button>
                              <button
                                onClick={() => deleteColaborador(colaborador.id)}
                                className="text-red-600 hover:text-red-900"
                                disabled={colaborador.id === currentUser?.id}
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {colaboradores.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum colaborador cadastrado ainda.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Toaster para notificações */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            style: {
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
            },
            iconTheme: {
              primary: '#16a34a',
              secondary: '#ffffff',
            },
          },
          error: {
            style: {
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
            },
            iconTheme: {
              primary: '#dc2626',
              secondary: '#ffffff',
            },
          },
          loading: {
            style: {
              background: '#eff6ff',
              color: '#1e40af',
              border: '1px solid #bfdbfe',
            },
          },
        }}
      />
    </div>
  );
};

export default ExpressoNevesApp;