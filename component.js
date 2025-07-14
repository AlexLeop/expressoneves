// <stdin>
import React, { useState, useEffect } from "https://esm.sh/react@18.2.0";
import { PlusCircle, Users, Store, Calendar, DollarSign, FileText, Settings, Eye, Edit, Trash2, Download, Upload } from "https://esm.sh/lucide-react?deps=react@18.2.0,react-dom@18.2.0";
import jsPDF from "https://esm.sh/jspdf?deps=react@18.2.0,react-dom@18.2.0";
import autoTable from "https://esm.sh/jspdf-autotable?deps=react@18.2.0,react-dom@18.2.0";
var { useStoredState } = hatch;
var MotoboysSystem = () => {
  const [isAuthenticated, setIsAuthenticated] = useStoredState("isAuthenticated", false);
  const [currentUser, setCurrentUser] = useStoredState("currentUser", null);
  const [colaboradores, setColaboradores] = useStoredState("colaboradores", [
    {
      id: "admin-001",
      nome: "Administrador",
      email: "admin@expressoneves.com",
      senha: "admin123",
      tipo: "admin",
      lojaId: null,
      ativo: true,
      dataCriacao: "2025-01-01"
    }
  ]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [motoboys, setMotoboys] = useStoredState("motoboys", []);
  const [lojas, setLojas] = useStoredState("lojas", []);
  const [jornadas, setJornadas] = useStoredState("jornadas", []);
  const [adiantamentos, setAdiantamentos] = useStoredState("adiantamentos", []);
  const [supervisao, setSupervisao] = useStoredState("supervisao", []);
  const [selectedWeek, setSelectedWeek] = useState("2025-01-13");
  const [showMotoboyModal, setShowMotoboyModal] = useState(false);
  const [showLojaModal, setShowLojaModal] = useState(false);
  const [showJornadaModal, setShowJornadaModal] = useState(false);
  const [showAdiantamentoModal, setShowAdiantamentoModal] = useState(false);
  const [showColaboradorModal, setShowColaboradorModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const login = (email, senha) => {
    const colaborador = colaboradores.find(
      (c) => c.email === email && c.senha === senha && c.ativo
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
    setActiveTab("dashboard");
  };
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
        manageLojas: false,
        // Não pode criar/editar lojas
        manageJornadas: true,
        manageAdiantamentos: true,
        viewRelatorios: true,
        manageColaboradores: false
      },
      lojista: {
        viewDashboard: true,
        manageMotoboys: false,
        manageLojas: false,
        manageJornadas: true,
        // Apenas para sua loja
        manageAdiantamentos: true,
        // Apenas para sua loja
        viewRelatorios: true,
        // Apenas para sua loja
        manageColaboradores: false
      }
    };
    return permissions[currentUser.tipo]?.[action] || false;
  };
  const canAccessLoja = (lojaId) => {
    if (!currentUser) return false;
    if (currentUser.tipo === "admin" || currentUser.tipo === "financeiro") return true;
    if (currentUser.tipo === "lojista") return currentUser.lojaId === lojaId;
    return false;
  };
  const formatCPF = (value) => {
    if (!value) return "";
    return value.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})/, "$1-$2").replace(/(-\d{2})\d+?$/, "$1");
  };
  const formatCNPJ = (value) => {
    if (!value) return "";
    return value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})/, "$1-$2").replace(/(-\d{2})\d+?$/, "$1");
  };
  const formatPhone = (value) => {
    if (!value) return "";
    return value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2").replace(/(\d{4})-(\d)(\d{4})/, "$1$2-$3").replace(/(-\d{4})\d+?$/, "$1");
  };
  const formatDateBR = (dateString) => {
    if (!dateString) return "";
    const date = /* @__PURE__ */ new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("pt-BR");
  };
  const isDomingoOuFeriado = (data, eFeriado) => {
    const dayOfWeek = new Date(data).getDay();
    return dayOfWeek === 0 || eFeriado;
  };
  const calcularHorasTrabalhadas = (horaEntrada, horaSaida) => {
    if (!horaEntrada || !horaSaida) return 0;
    const [horaE, minutoE] = horaEntrada.split(":").map(Number);
    const [horaS, minutoS] = horaSaida.split(":").map(Number);
    let minutosEntrada = horaE * 60 + minutoE;
    let minutosSaida = horaS * 60 + minutoS;
    if (minutosSaida < minutosEntrada) {
      minutosSaida += 24 * 60;
    }
    const totalMinutos = minutosSaida - minutosEntrada;
    return totalMinutos / 60;
  };
  const calcularValorJornada = (jornada) => {
    if (!jornada) return 0;
    const loja = lojas.find((l) => l.id === jornada.lojaId);
    if (!loja) return 0;
    const valorDiaria = Number(jornada.valorDiaria) || 0;
    const corridasAte5km = Number(jornada.corridasAte5km) || 0;
    const corridasAcima5km = Number(jornada.corridasAcima5km) || 0;
    const valorCorridaAte5km = Number(loja.valorCorridaAte5km) || 0;
    const valorCorridaAcima5km = Number(loja.valorCorridaAcima5km) || 0;
    const valorCorridas = corridasAte5km * valorCorridaAte5km + corridasAcima5km * valorCorridaAcima5km;
    const valorComissoes = Number(jornada.comissoes) || 0;
    const valorMissoes = Number(jornada.missoes) || 0;
    const valorTotal = valorDiaria + valorCorridas + valorComissoes + valorMissoes;
    return isNaN(valorTotal) ? 0 : valorTotal;
  };
  const calcularCustosLoja = (jornadas2, loja) => {
    if (!loja || jornadas2.length === 0) return {
      valorLogistica: 0,
      comissaoAdministrativa: 0,
      taxaSupervisao: 0,
      total: 0
    };
    const valorLogistica = jornadas2.reduce((sum, j) => sum + calcularValorJornada(j), 0);
    const taxaAdministrativa = loja.taxaAdministrativa || 0;
    const taxaSupervisao = jornadas2.length > 0 ? loja.taxaSupervisao || 0 : 0;
    const total = valorLogistica + taxaAdministrativa + taxaSupervisao;
    return {
      valorLogistica,
      comissaoAdministrativa: taxaAdministrativa,
      taxaSupervisao,
      total
    };
  };
  const getWeekRange = (dateString) => {
    const date = new Date(dateString);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return { weekStart, weekEnd };
  };
  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-4" }, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-semibold" }, title), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: onClose,
        className: "text-gray-500 hover:text-gray-700 text-2xl leading-none"
      },
      "\xD7"
    )), children));
  };
  const MotoboyModal = () => {
    const [formData, setFormData] = useState({
      nome: "",
      cpf: "",
      telefone: "",
      status: "ativo"
    });
    useEffect(() => {
      if (editingItem) {
        setFormData({ ...editingItem });
      } else {
        setFormData({
          nome: "",
          cpf: "",
          telefone: "",
          status: "ativo"
        });
      }
    }, [editingItem]);
    const handleSubmit = (e) => {
      e.preventDefault();
      const newData = {
        ...formData
      };
      if (editingItem) {
        setMotoboys(motoboys.map((m) => m.id === editingItem.id ? { ...newData, id: editingItem.id } : m));
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
    return /* @__PURE__ */ React.createElement(Modal, { isOpen: showMotoboyModal, onClose: handleClose, title: "Cadastro de Motoboy" }, /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmit, className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Nome Completo"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: formData.nome,
        onChange: (e) => setFormData({ ...formData, nome: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "CPF"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: formData.cpf,
        onChange: (e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        maxLength: "14",
        required: true
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Telefone"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: formData.telefone,
        onChange: (e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Status"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: formData.status,
        onChange: (e) => setFormData({ ...formData, status: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      },
      /* @__PURE__ */ React.createElement("option", { value: "ativo" }, "Ativo"),
      /* @__PURE__ */ React.createElement("option", { value: "inativo" }, "Inativo")
    )), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("button", { type: "submit", className: "flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors" }, editingItem ? "Atualizar" : "Cadastrar"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: handleClose, className: "flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400 transition-colors" }, "Cancelar"))));
  };
  const LojaModal = () => {
    const [formData, setFormData] = useState({
      nome: "",
      cnpj: "",
      contato: "",
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
          nome: "",
          cnpj: "",
          contato: "",
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
        valorCorridaAte5km: Number(formData.valorCorridaAte5km),
        valorCorridaAcima5km: Number(formData.valorCorridaAcima5km),
        taxaAdministrativa: Number(formData.taxaAdministrativa),
        taxaSupervisao: Number(formData.taxaSupervisao)
      };
      if (editingItem) {
        setLojas(lojas.map((l) => l.id === editingItem.id ? { ...newData, id: editingItem.id } : l));
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
    return /* @__PURE__ */ React.createElement(Modal, { isOpen: showLojaModal, onClose: handleClose, title: "Cadastro de Loja" }, /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmit, className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Nome da Loja"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: formData.nome,
        onChange: (e) => setFormData({ ...formData, nome: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "CNPJ"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: formData.cnpj,
        onChange: (e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        maxLength: "18",
        required: true
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Contato"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: formData.contato,
        onChange: (e) => setFormData({ ...formData, contato: formatPhone(e.target.value) }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Valor Corrida at\xE9 5km (R$)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        step: "0.01",
        value: formData.valorCorridaAte5km,
        onChange: (e) => setFormData({ ...formData, valorCorridaAte5km: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Valor Corrida acima de 5km (R$)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        step: "0.01",
        value: formData.valorCorridaAcima5km,
        onChange: (e) => setFormData({ ...formData, valorCorridaAcima5km: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Taxa Administrativa (R$)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        step: "0.01",
        value: formData.taxaAdministrativa,
        onChange: (e) => setFormData({ ...formData, taxaAdministrativa: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Taxa Supervis\xE3o (R$)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        step: "0.01",
        value: formData.taxaSupervisao,
        onChange: (e) => setFormData({ ...formData, taxaSupervisao: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("button", { type: "submit", className: "flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors" }, editingItem ? "Atualizar" : "Cadastrar"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: handleClose, className: "flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400 transition-colors" }, "Cancelar"))));
  };
  const JornadaModal = () => {
    const [formData, setFormData] = useState({
      data: "",
      motoboyId: "",
      lojaId: "",
      horasEntrada: "",
      horasSaida: "",
      valorDiaria: 120,
      corridasAte5km: 0,
      corridasAcima5km: 0,
      comissoes: 0,
      missoes: 0,
      eFeriado: false,
      observacoes: ""
    });
    useEffect(() => {
      if (editingItem) {
        setFormData({ ...editingItem });
      } else {
        const initialLojaId = currentUser?.tipo === "lojista" ? currentUser.lojaId : "";
        setFormData({
          data: "",
          motoboyId: "",
          lojaId: initialLojaId,
          horasEntrada: "",
          horasSaida: "",
          valorDiaria: 120,
          corridasAte5km: 0,
          corridasAcima5km: 0,
          comissoes: 0,
          missoes: 0,
          eFeriado: false,
          observacoes: ""
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
        setJornadas(jornadas.map((j) => j.id === editingItem.id ? { ...newData, id: editingItem.id } : j));
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
    return /* @__PURE__ */ React.createElement(Modal, { isOpen: showJornadaModal, onClose: handleClose, title: "Registro de Jornada" }, /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmit, className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Data"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "date",
        value: formData.data,
        onChange: (e) => setFormData({ ...formData, data: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Motoboy"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: formData.motoboyId,
        onChange: (e) => setFormData({ ...formData, motoboyId: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, "Selecione um motoboy"),
      motoboys.filter((m) => m.status === "ativo").map((motoboy) => /* @__PURE__ */ React.createElement("option", { key: motoboy.id, value: motoboy.id }, motoboy.nome))
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Loja"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: formData.lojaId,
        onChange: (e) => setFormData({ ...formData, lojaId: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true,
        disabled: currentUser?.tipo === "lojista"
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, "Selecione uma loja"),
      lojas.filter((loja) => canAccessLoja(loja.id)).map((loja) => /* @__PURE__ */ React.createElement("option", { key: loja.id, value: loja.id }, loja.nome))
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Hora Entrada"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "time",
        value: formData.horasEntrada,
        onChange: (e) => setFormData({ ...formData, horasEntrada: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Hora Sa\xEDda"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "time",
        value: formData.horasSaida,
        onChange: (e) => setFormData({ ...formData, horasSaida: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      }
    ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Valor da Di\xE1ria (R$)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        step: "0.01",
        value: formData.valorDiaria,
        onChange: (e) => setFormData({ ...formData, valorDiaria: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true,
        min: "0"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Corridas at\xE9 5km"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        value: formData.corridasAte5km,
        onChange: (e) => setFormData({ ...formData, corridasAte5km: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        min: "0",
        required: true
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Corridas acima de 5km"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        value: formData.corridasAcima5km,
        onChange: (e) => setFormData({ ...formData, corridasAcima5km: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        min: "0",
        required: true
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Comiss\xF5es (R$)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        step: "0.01",
        value: formData.comissoes,
        onChange: (e) => setFormData({ ...formData, comissoes: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        min: "0"
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Miss\xF5es (R$)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        step: "0.01",
        value: formData.missoes,
        onChange: (e) => setFormData({ ...formData, missoes: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        min: "0"
      }
    ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "flex items-center" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        checked: formData.eFeriado,
        onChange: (e) => setFormData({ ...formData, eFeriado: e.target.checked }),
        className: "mr-2"
      }
    ), "\xC9 feriado?")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Observa\xE7\xF5es"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        value: formData.observacoes,
        onChange: (e) => setFormData({ ...formData, observacoes: e.target.value }),
        className: "w-full border rounded px-3 py-2 h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("button", { type: "submit", className: "flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors" }, editingItem ? "Atualizar" : "Registrar"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: handleClose, className: "flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400 transition-colors" }, "Cancelar"))));
  };
  const ColaboradorModal = () => {
    const [formData, setFormData] = useState({
      nome: "",
      email: "",
      senha: "",
      tipo: "lojista",
      lojaId: "",
      ativo: true
    });
    useEffect(() => {
      if (editingItem) {
        setFormData({ ...editingItem });
      } else {
        setFormData({
          nome: "",
          email: "",
          senha: "",
          tipo: "lojista",
          lojaId: "",
          ativo: true
        });
      }
    }, [editingItem]);
    const handleSubmit = (e) => {
      e.preventDefault();
      const emailExists = colaboradores.some(
        (c) => c.email === formData.email && (!editingItem || c.id !== editingItem.id)
      );
      if (emailExists) {
        alert("Este email j\xE1 est\xE1 cadastrado!");
        return;
      }
      const newData = {
        ...formData,
        lojaId: formData.tipo === "lojista" ? formData.lojaId : null
      };
      if (editingItem) {
        setColaboradores(colaboradores.map(
          (c) => c.id === editingItem.id ? { ...newData, id: editingItem.id } : c
        ));
      } else {
        setColaboradores([...colaboradores, {
          ...newData,
          id: Date.now().toString(),
          dataCriacao: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
        }]);
      }
      setShowColaboradorModal(false);
      setEditingItem(null);
    };
    const handleClose = () => {
      setShowColaboradorModal(false);
      setEditingItem(null);
    };
    return /* @__PURE__ */ React.createElement(Modal, { isOpen: showColaboradorModal, onClose: handleClose, title: "Cadastro de Colaborador" }, /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmit, className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Nome Completo"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: formData.nome,
        onChange: (e) => setFormData({ ...formData, nome: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Email"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "email",
        value: formData.email,
        onChange: (e) => setFormData({ ...formData, email: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Senha"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "password",
        value: formData.senha,
        onChange: (e) => setFormData({ ...formData, senha: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true,
        minLength: "6"
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Tipo de Usu\xE1rio"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: formData.tipo,
        onChange: (e) => setFormData({ ...formData, tipo: e.target.value, lojaId: "" }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      },
      /* @__PURE__ */ React.createElement("option", { value: "lojista" }, "Lojista"),
      /* @__PURE__ */ React.createElement("option", { value: "financeiro" }, "Financeiro"),
      /* @__PURE__ */ React.createElement("option", { value: "admin" }, "Administrador")
    )), formData.tipo === "lojista" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Loja"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: formData.lojaId,
        onChange: (e) => setFormData({ ...formData, lojaId: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, "Selecione uma loja"),
      lojas.map((loja) => /* @__PURE__ */ React.createElement("option", { key: loja.id, value: loja.id }, loja.nome))
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "flex items-center" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        checked: formData.ativo,
        onChange: (e) => setFormData({ ...formData, ativo: e.target.checked }),
        className: "mr-2"
      }
    ), "Usu\xE1rio Ativo")), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("button", { type: "submit", className: "flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors" }, editingItem ? "Atualizar" : "Cadastrar"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: handleClose, className: "flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400 transition-colors" }, "Cancelar"))));
  };
  const LoginScreen = () => {
    const [loginData, setLoginData] = useState({ email: "", senha: "" });
    const [error, setError] = useState("");
    const handleLogin = (e) => {
      e.preventDefault();
      setError("");
      if (login(loginData.email, loginData.senha)) {
        setLoginData({ email: "", senha: "" });
      } else {
        setError("Email ou senha incorretos, ou usu\xE1rio inativo.");
      }
    };
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-100 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white p-8 rounded-lg shadow-md w-full max-w-md" }, /* @__PURE__ */ React.createElement("div", { className: "text-center mb-8" }, /* @__PURE__ */ React.createElement(
      "img",
      {
        src: "assets/JeFG5upo7Hg6wrzGnryGF.jpeg",
        alt: "Expresso Neves",
        className: "h-16 w-auto mx-auto mb-4"
      }
    ), /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-bold text-gray-900" }, "Expresso Neves"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600" }, "Sistema de Gest\xE3o de Motoboys")), /* @__PURE__ */ React.createElement("form", { onSubmit: handleLogin, className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Email"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "email",
        value: loginData.email,
        onChange: (e) => setLoginData({ ...loginData, email: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        placeholder: "seu@email.com",
        required: true
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Senha"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "password",
        value: loginData.senha,
        onChange: (e) => setLoginData({ ...loginData, senha: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        placeholder: "********",
        required: true
      }
    )), error && /* @__PURE__ */ React.createElement("div", { className: "text-red-600 text-sm bg-red-50 p-2 rounded" }, error), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "submit",
        className: "w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
      },
      "Entrar"
    )), /* @__PURE__ */ React.createElement("div", { className: "mt-6 text-center text-sm text-gray-500" }, /* @__PURE__ */ React.createElement("p", null, "Usu\xE1rio de teste:"), /* @__PURE__ */ React.createElement("p", null, "Email: ", /* @__PURE__ */ React.createElement("strong", null, "admin@expressoneves.com")), /* @__PURE__ */ React.createElement("p", null, "Senha: ", /* @__PURE__ */ React.createElement("strong", null, "admin123")))));
  };
  const AdiantamentoModal = () => {
    const [formData, setFormData] = useState({
      motoboyId: "",
      lojaId: "",
      valor: 0,
      data: "",
      observacao: ""
    });
    useEffect(() => {
      if (editingItem) {
        setFormData({ ...editingItem });
      } else {
        const initialLojaId = currentUser?.tipo === "lojista" ? currentUser.lojaId : "";
        setFormData({
          motoboyId: "",
          lojaId: initialLojaId,
          valor: 0,
          data: "",
          observacao: ""
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
        setAdiantamentos(adiantamentos.map((a) => a.id === editingItem.id ? { ...newData, id: editingItem.id } : a));
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
    return /* @__PURE__ */ React.createElement(Modal, { isOpen: showAdiantamentoModal, onClose: handleClose, title: "Registro de Adiantamento" }, /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmit, className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Motoboy"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: formData.motoboyId,
        onChange: (e) => setFormData({ ...formData, motoboyId: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, "Selecione um motoboy"),
      motoboys.filter((m) => m.status === "ativo").map((motoboy) => /* @__PURE__ */ React.createElement("option", { key: motoboy.id, value: motoboy.id }, motoboy.nome))
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Loja"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: formData.lojaId,
        onChange: (e) => setFormData({ ...formData, lojaId: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true,
        disabled: currentUser?.tipo === "lojista"
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, "Selecione uma loja"),
      lojas.filter((loja) => canAccessLoja(loja.id)).map((loja) => /* @__PURE__ */ React.createElement("option", { key: loja.id, value: loja.id }, loja.nome))
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Valor (R$)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        step: "0.01",
        value: formData.valor,
        onChange: (e) => setFormData({ ...formData, valor: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        min: "0",
        required: true
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Data"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "date",
        value: formData.data,
        onChange: (e) => setFormData({ ...formData, data: e.target.value }),
        className: "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        required: true
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-sm font-medium mb-1" }, "Observa\xE7\xE3o"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        value: formData.observacao,
        onChange: (e) => setFormData({ ...formData, observacao: e.target.value }),
        className: "w-full border rounded px-3 py-2 h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("button", { type: "submit", className: "flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors" }, editingItem ? "Atualizar" : "Registrar"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: handleClose, className: "flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400 transition-colors" }, "Cancelar"))));
  };
  const Dashboard = () => {
    const { weekStart, weekEnd } = getWeekRange(selectedWeek);
    const jornadasSemana = jornadas.filter((j) => {
      const dataJornada = new Date(j.data);
      return dataJornada >= weekStart && dataJornada <= weekEnd;
    });
    const totalFaturamento = jornadasSemana.reduce((sum, j) => sum + calcularValorJornada(j), 0);
    const totalCorridas = jornadasSemana.reduce((sum, j) => sum + (j.corridasAte5km || 0) + (j.corridasAcima5km || 0), 0);
    const motoboyAtivos = motoboys.filter((m) => m.status === "ativo").length;
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold" }, "Dashboard"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row gap-2 items-center" }, /* @__PURE__ */ React.createElement("label", { className: "text-sm font-medium" }, "Semana:"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "date",
        value: selectedWeek,
        onChange: (e) => setSelectedWeek(e.target.value),
        className: "border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-blue-50 border border-blue-200 p-4 rounded-lg" }, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-semibold text-blue-800" }, "Faturamento Semanal"), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold text-blue-600" }, "R$ ", totalFaturamento.toFixed(2))), /* @__PURE__ */ React.createElement("div", { className: "bg-green-50 border border-green-200 p-4 rounded-lg" }, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-semibold text-green-800" }, "Total de Corridas"), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold text-green-600" }, totalCorridas)), /* @__PURE__ */ React.createElement("div", { className: "bg-yellow-50 border border-yellow-200 p-4 rounded-lg" }, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-semibold text-yellow-800" }, "Jornadas Semana"), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold text-yellow-600" }, jornadasSemana.length)), /* @__PURE__ */ React.createElement("div", { className: "bg-purple-50 border border-purple-200 p-4 rounded-lg" }, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-semibold text-purple-800" }, "Motoboys Ativos"), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold text-purple-600" }, motoboyAtivos))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white border rounded-lg p-4" }, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-semibold mb-4" }, "Jornadas da Semana"), /* @__PURE__ */ React.createElement("div", { className: "space-y-2 max-h-64 overflow-y-auto" }, jornadasSemana.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-gray-500 text-center py-4" }, "Nenhuma jornada registrada nesta semana") : jornadasSemana.map((jornada) => {
      const motoboy = motoboys.find((m) => m.id === jornada.motoboyId);
      const loja = lojas.find((l) => l.id === jornada.lojaId);
      return /* @__PURE__ */ React.createElement("div", { key: jornada.id, className: "border-l-4 border-blue-500 pl-3 py-2 bg-gray-50 rounded" }, /* @__PURE__ */ React.createElement("div", { className: "font-medium" }, motoboy?.nome || "Motoboy n\xE3o encontrado"), /* @__PURE__ */ React.createElement("div", { className: "text-sm text-gray-600" }, loja?.nome || "Loja n\xE3o encontrada", " - ", formatDateBR(jornada.data)), /* @__PURE__ */ React.createElement("div", { className: "text-sm" }, "R$ ", calcularValorJornada(jornada).toFixed(2)));
    }))), /* @__PURE__ */ React.createElement("div", { className: "bg-white border rounded-lg p-4" }, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-semibold mb-4" }, "Resumo por Loja"), /* @__PURE__ */ React.createElement("div", { className: "space-y-2 max-h-64 overflow-y-auto" }, lojas.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-gray-500 text-center py-4" }, "Nenhuma loja cadastrada") : lojas.map((loja) => {
      const jornadasLoja = jornadasSemana.filter((j) => j.lojaId === loja.id);
      const custos = calcularCustosLoja(jornadasLoja, loja);
      return /* @__PURE__ */ React.createElement("div", { key: loja.id, className: "border-l-4 border-green-500 pl-3 py-2 bg-gray-50 rounded" }, /* @__PURE__ */ React.createElement("div", { className: "font-medium" }, loja.nome), /* @__PURE__ */ React.createElement("div", { className: "text-sm text-gray-600" }, "Jornadas: ", jornadasLoja.length), /* @__PURE__ */ React.createElement("div", { className: "text-sm text-gray-600" }, "Log\xEDstica: R$ ", custos.valorLogistica.toFixed(2)), /* @__PURE__ */ React.createElement("div", { className: "text-sm text-gray-600" }, "Total Custo: R$ ", custos.total.toFixed(2)));
    })))));
  };
  const MotoboysTab = () => {
    const deleteMotoboy = (id) => {
      if (window.confirm("Tem certeza que deseja excluir este motoboy?")) {
        setMotoboys(motoboys.filter((m) => m.id !== id));
      }
    };
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold" }, "Motoboys"), hasPermission("manageMotoboys") && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setShowMotoboyModal(true),
        className: "flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      },
      /* @__PURE__ */ React.createElement(PlusCircle, { size: 20 }),
      "Novo Motoboy"
    )), /* @__PURE__ */ React.createElement("div", { className: "bg-white border rounded-lg overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-gray-50" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Nome"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "CPF"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Telefone"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Status"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "A\xE7\xF5es"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-gray-200" }, motoboys.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "5", className: "px-4 py-8 text-center text-gray-500" }, "Nenhum motoboy cadastrado")) : motoboys.map((motoboy) => /* @__PURE__ */ React.createElement("tr", { key: motoboy.id, className: "hover:bg-gray-50" }, /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, motoboy.nome), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, motoboy.cpf), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, motoboy.telefone), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, /* @__PURE__ */ React.createElement("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${motoboy.status === "ativo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}` }, motoboy.status)), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setEditingItem(motoboy);
          setShowMotoboyModal(true);
        },
        className: "text-blue-600 hover:text-blue-800 transition-colors"
      },
      /* @__PURE__ */ React.createElement(Edit, { size: 16 })
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => deleteMotoboy(motoboy.id),
        className: "text-red-600 hover:text-red-800 transition-colors"
      },
      /* @__PURE__ */ React.createElement(Trash2, { size: 16 })
    ))))))))));
  };
  const LojasTab = () => {
    const deleteLoja = (id) => {
      if (window.confirm("Tem certeza que deseja excluir esta loja?")) {
        setLojas(lojas.filter((l) => l.id !== id));
      }
    };
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold" }, "Lojas"), hasPermission("manageLojas") && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setShowLojaModal(true),
        className: "flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      },
      /* @__PURE__ */ React.createElement(PlusCircle, { size: 20 }),
      "Nova Loja"
    )), /* @__PURE__ */ React.createElement("div", { className: "bg-white border rounded-lg overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-gray-50" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Nome"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "CNPJ"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Contato"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Taxa Admin"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Taxa Super"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "A\xE7\xF5es"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-gray-200" }, lojas.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "6", className: "px-4 py-8 text-center text-gray-500" }, "Nenhuma loja cadastrada")) : lojas.map((loja) => /* @__PURE__ */ React.createElement("tr", { key: loja.id, className: "hover:bg-gray-50" }, /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, loja.nome), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, loja.cnpj), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, loja.contato), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, "R$ ", Number(loja.taxaAdministrativa || 0).toFixed(2)), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, "R$ ", Number(loja.taxaSupervisao || 0).toFixed(2)), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setEditingItem(loja);
          setShowLojaModal(true);
        },
        className: "text-blue-600 hover:text-blue-800 transition-colors"
      },
      /* @__PURE__ */ React.createElement(Edit, { size: 16 })
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => deleteLoja(loja.id),
        className: "text-red-600 hover:text-red-800 transition-colors"
      },
      /* @__PURE__ */ React.createElement(Trash2, { size: 16 })
    ))))))))));
  };
  const JornadasTab = () => {
    const deleteJornada = (id) => {
      if (window.confirm("Tem certeza que deseja excluir esta jornada?")) {
        setJornadas(jornadas.filter((j) => j.id !== id));
      }
    };
    const calcularDetalhesJornada = (jornada) => {
      if (!jornada) return { horasTrabalhadas: 0, valorDiaria: 0, valorCorridas: 0, valorComissoes: 0, valorMissoes: 0, valorTotal: 0 };
      const loja = lojas.find((l) => l.id === jornada.lojaId);
      if (!loja) return { horasTrabalhadas: 0, valorDiaria: 0, valorCorridas: 0, valorComissoes: 0, valorMissoes: 0, valorTotal: 0 };
      const horasTrabalhadas = calcularHorasTrabalhadas(jornada.horasEntrada, jornada.horasSaida);
      const valorDiaria = Number(jornada.valorDiaria) || 0;
      const corridasAte5km = Number(jornada.corridasAte5km) || 0;
      const corridasAcima5km = Number(jornada.corridasAcima5km) || 0;
      const valorCorridaAte5km = Number(loja.valorCorridaAte5km) || 0;
      const valorCorridaAcima5km = Number(loja.valorCorridaAcima5km) || 0;
      const valorCorridas = corridasAte5km * valorCorridaAte5km + corridasAcima5km * valorCorridaAcima5km;
      const valorComissoes = Number(jornada.comissoes) || 0;
      const valorMissoes = Number(jornada.missoes) || 0;
      const valorTotal = valorDiaria + valorCorridas + valorComissoes + valorMissoes;
      return {
        horasTrabalhadas,
        valorDiaria,
        valorCorridas,
        valorComissoes,
        valorMissoes,
        valorTotal: isNaN(valorTotal) ? 0 : valorTotal
      };
    };
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold" }, "Jornadas"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setShowJornadaModal(true),
        className: "flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      },
      /* @__PURE__ */ React.createElement(PlusCircle, { size: 20 }),
      "Nova Jornada"
    )), /* @__PURE__ */ React.createElement("div", { className: "bg-white border rounded-lg overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-gray-50" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Data"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Motoboy"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Loja"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Hor\xE1rio"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Horas"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Valor Di\xE1ria"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Corridas \u22645km"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Corridas >5km"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Valor Corridas"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Extras"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Total"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "A\xE7\xF5es"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-gray-200" }, jornadas.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "12", className: "px-4 py-8 text-center text-gray-500" }, "Nenhuma jornada registrada")) : jornadas.filter((jornada) => canAccessLoja(jornada.lojaId)).map((jornada) => {
      const motoboy = motoboys.find((m) => m.id === jornada.motoboyId);
      const loja = lojas.find((l) => l.id === jornada.lojaId);
      const detalhes = calcularDetalhesJornada(jornada);
      const totalExtras = detalhes.valorComissoes + detalhes.valorMissoes;
      return /* @__PURE__ */ React.createElement("tr", { key: jornada.id, className: "hover:bg-gray-50" }, /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, /* @__PURE__ */ React.createElement("div", null, formatDateBR(jornada.data), jornada.eFeriado && /* @__PURE__ */ React.createElement("span", { className: "block text-xs text-red-600 font-medium" }, "FERIADO"))), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, motoboy?.nome || "N/A"), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, loja?.nome || "N/A"), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm" }, jornada.horasEntrada, " - ", jornada.horasSaida)), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, /* @__PURE__ */ React.createElement("span", { className: "font-medium" }, detalhes.horasTrabalhadas.toFixed(1), "h")), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-blue-600 font-medium" }, "R$ ", (Number(jornada.valorDiaria) || 0).toFixed(2))), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 text-center" }, jornada.corridasAte5km || 0), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 text-center" }, jornada.corridasAcima5km || 0), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-green-600 font-medium" }, "R$ ", detalhes.valorCorridas.toFixed(2))), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, totalExtras > 0 ? /* @__PURE__ */ React.createElement("div", { className: "text-sm" }, /* @__PURE__ */ React.createElement("span", { className: "text-purple-600 font-medium" }, "R$ ", totalExtras.toFixed(2)), (detalhes.valorComissoes > 0 || detalhes.valorMissoes > 0) && /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500" }, detalhes.valorComissoes > 0 && `Com: ${detalhes.valorComissoes.toFixed(2)}`, detalhes.valorComissoes > 0 && detalhes.valorMissoes > 0 && " | ", detalhes.valorMissoes > 0 && `Mis: ${detalhes.valorMissoes.toFixed(2)}`)) : /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, "R$ 0,00")), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-gray-800" }, "R$ ", detalhes.valorTotal.toFixed(2))), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            setEditingItem(jornada);
            setShowJornadaModal(true);
          },
          className: "text-blue-600 hover:text-blue-800 transition-colors"
        },
        /* @__PURE__ */ React.createElement(Edit, { size: 16 })
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => deleteJornada(jornada.id),
          className: "text-red-600 hover:text-red-800 transition-colors"
        },
        /* @__PURE__ */ React.createElement(Trash2, { size: 16 })
      ))));
    }))))));
  };
  const ColaboradoresTab = () => {
    const deleteColaborador = (id) => {
      if (window.confirm("Tem certeza que deseja excluir este colaborador?")) {
        setColaboradores(colaboradores.filter((c) => c.id !== id));
      }
    };
    const getTipoLabel = (tipo) => {
      const labels = {
        admin: "Administrador",
        financeiro: "Financeiro",
        lojista: "Lojista"
      };
      return labels[tipo] || tipo;
    };
    const getTipoBadgeColor = (tipo) => {
      const colors = {
        admin: "bg-red-100 text-red-800",
        financeiro: "bg-blue-100 text-blue-800",
        lojista: "bg-green-100 text-green-800"
      };
      return colors[tipo] || "bg-gray-100 text-gray-800";
    };
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold" }, "Colaboradores"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setShowColaboradorModal(true),
        className: "flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      },
      /* @__PURE__ */ React.createElement(PlusCircle, { size: 20 }),
      "Novo Colaborador"
    )), /* @__PURE__ */ React.createElement("div", { className: "bg-white border rounded-lg overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-gray-50" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Nome"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Email"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Tipo"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Loja"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Status"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Data Cria\xE7\xE3o"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "A\xE7\xF5es"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-gray-200" }, colaboradores.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "7", className: "px-4 py-8 text-center text-gray-500" }, "Nenhum colaborador cadastrado")) : colaboradores.map((colaborador) => {
      const loja = lojas.find((l) => l.id === colaborador.lojaId);
      return /* @__PURE__ */ React.createElement("tr", { key: colaborador.id, className: "hover:bg-gray-50" }, /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, colaborador.nome), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, colaborador.email), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, /* @__PURE__ */ React.createElement("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${getTipoBadgeColor(colaborador.tipo)}` }, getTipoLabel(colaborador.tipo))), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, loja?.nome || "-"), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, /* @__PURE__ */ React.createElement("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${colaborador.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}` }, colaborador.ativo ? "Ativo" : "Inativo")), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, formatDateBR(colaborador.dataCriacao)), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            setEditingItem(colaborador);
            setShowColaboradorModal(true);
          },
          className: "text-blue-600 hover:text-blue-800 transition-colors"
        },
        /* @__PURE__ */ React.createElement(Edit, { size: 16 })
      ), colaborador.id !== currentUser?.id && /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => deleteColaborador(colaborador.id),
          className: "text-red-600 hover:text-red-800 transition-colors"
        },
        /* @__PURE__ */ React.createElement(Trash2, { size: 16 })
      ))));
    }))))));
  };
  const AdiantamentosTab = () => {
    const deleteAdiantamento = (id) => {
      if (window.confirm("Tem certeza que deseja excluir este adiantamento?")) {
        setAdiantamentos(adiantamentos.filter((a) => a.id !== id));
      }
    };
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold" }, "Adiantamentos"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setShowAdiantamentoModal(true),
        className: "flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      },
      /* @__PURE__ */ React.createElement(PlusCircle, { size: 20 }),
      "Novo Adiantamento"
    )), /* @__PURE__ */ React.createElement("div", { className: "bg-white border rounded-lg overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-gray-50" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Data"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Motoboy"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Loja"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Valor"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Observa\xE7\xE3o"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "A\xE7\xF5es"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-gray-200" }, adiantamentos.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "6", className: "px-4 py-8 text-center text-gray-500" }, "Nenhum adiantamento registrado")) : adiantamentos.filter((adiantamento) => canAccessLoja(adiantamento.lojaId)).map((adiantamento) => {
      const motoboy = motoboys.find((m) => m.id === adiantamento.motoboyId);
      const loja = lojas.find((l) => l.id === adiantamento.lojaId);
      return /* @__PURE__ */ React.createElement("tr", { key: adiantamento.id, className: "hover:bg-gray-50" }, /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, formatDateBR(adiantamento.data)), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, motoboy?.nome || "N/A"), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, loja?.nome || "N/A"), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, "R$ ", Number(adiantamento.valor || 0).toFixed(2)), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, adiantamento.observacao), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            setEditingItem(adiantamento);
            setShowAdiantamentoModal(true);
          },
          className: "text-blue-600 hover:text-blue-800 transition-colors"
        },
        /* @__PURE__ */ React.createElement(Edit, { size: 16 })
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => deleteAdiantamento(adiantamento.id),
          className: "text-red-600 hover:text-red-800 transition-colors"
        },
        /* @__PURE__ */ React.createElement(Trash2, { size: 16 })
      ))));
    }))))));
  };
  const RelatoriosTab = () => {
    const [filtroLoja, setFiltroLoja] = useState(
      currentUser?.tipo === "lojista" ? currentUser.lojaId : ""
    );
    const { weekStart, weekEnd } = getWeekRange(selectedWeek);
    const jornadasSemana = jornadas.filter((j) => {
      if (!j.data) return false;
      const dataJornada = new Date(j.data);
      const dentroSemana = dataJornada >= weekStart && dataJornada <= weekEnd;
      const filtroLojaMatch = !filtroLoja || j.lojaId === filtroLoja;
      return dentroSemana && filtroLojaMatch;
    });
    const adiantamentosSemana = adiantamentos.filter((a) => {
      if (!a.data) return false;
      const dataAdiantamento = new Date(a.data);
      const dentroSemana = dataAdiantamento >= weekStart && dataAdiantamento <= weekEnd;
      const filtroLojaMatch = !filtroLoja || a.lojaId === filtroLoja;
      return dentroSemana && filtroLojaMatch;
    });
    const exportarRelatorioMotoboyCSV = () => {
      const dados = relatorioMotoboys.filter((r) => r.temAtividade);
      if (dados.length === 0) {
        alert("Nenhum dado para exportar no per\xEDodo selecionado.");
        return;
      }
      let csvContent = "";
      if (filtroLoja) {
        const loja = lojas.find((l) => l.id === filtroLoja);
        csvContent += `EXPRESSO NEVES - RELAT\xD3RIO DE MOTOBOYS
`;
        csvContent += `LOJA: ${loja?.nome || "N/A"}
`;
        csvContent += `Per\xEDodo: ${weekStart.toLocaleDateString("pt-BR")} a ${weekEnd.toLocaleDateString("pt-BR")}

`;
        csvContent += ["Motoboy", "Total Horas", "Total Corridas", "Corridas \u22645km", "Corridas >5km", "Valor Bruto", "Adiantamentos", "Valor L\xEDquido"].join(",") + "\n";
        dados.forEach((r) => {
          csvContent += [
            r.motoboy.nome,
            r.totalHoras.toFixed(1),
            r.totalCorridas,
            r.totalCorridasAte5km,
            r.totalCorridasAcima5km,
            `R$ ${r.valorBruto.toFixed(2)}`,
            `R$ ${r.totalAdiantamentos.toFixed(2)}`,
            `R$ ${r.valorLiquido.toFixed(2)}`
          ].join(",") + "\n";
        });
      } else {
        csvContent += `EXPRESSO NEVES - RELAT\xD3RIO DE MOTOBOYS POR LOJA
`;
        csvContent += `Per\xEDodo: ${weekStart.toLocaleDateString("pt-BR")} a ${weekEnd.toLocaleDateString("pt-BR")}

`;
        lojas.forEach((loja) => {
          const motoboysDaLoja = dados.filter((r) => {
            const jornadasDoMotoboy = jornadasSemana.filter((j) => j.motoboyId === r.motoboy.id && j.lojaId === loja.id);
            return jornadasDoMotoboy.length > 0;
          });
          if (motoboysDaLoja.length > 0) {
            csvContent += `
LOJA: ${loja.nome}
`;
            csvContent += ["Motoboy", "Total Horas", "Total Corridas", "Corridas \u22645km", "Corridas >5km", "Valor Bruto", "Adiantamentos", "Valor L\xEDquido"].join(",") + "\n";
            motoboysDaLoja.forEach((r) => {
              csvContent += [
                r.motoboy.nome,
                r.totalHoras.toFixed(1),
                r.totalCorridas,
                r.totalCorridasAte5km,
                r.totalCorridasAcima5km,
                `R$ ${r.valorBruto.toFixed(2)}`,
                `R$ ${r.totalAdiantamentos.toFixed(2)}`,
                `R$ ${r.valorLiquido.toFixed(2)}`
              ].join(",") + "\n";
            });
            csvContent += `${"=".repeat(80)}
`;
          }
        });
      }
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio_motoboys_${weekStart.toLocaleDateString("pt-BR").replace(/\//g, "-")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };
    const exportarRelatorioMotoboyPDF = () => {
      const dados = relatorioMotoboys.filter((r) => r.temAtividade);
      if (dados.length === 0) {
        alert("Nenhum dado para exportar no per\xEDodo selecionado.");
        return;
      }
      const doc = new jsPDF();
      let currentY = 20;
      if (filtroLoja) {
        const loja = lojas.find((l) => l.id === filtroLoja);
        doc.setFontSize(16);
        doc.text("EXPRESSO NEVES - RELAT\xD3RIO DE MOTOBOYS", 20, currentY);
        currentY += 10;
        doc.setFontSize(12);
        doc.text(`Per\xEDodo: ${weekStart.toLocaleDateString("pt-BR")} a ${weekEnd.toLocaleDateString("pt-BR")}`, 20, currentY);
        currentY += 7;
        doc.text(`Loja: ${loja?.nome || "N/A"}`, 20, currentY);
        currentY += 15;
        const tableData = dados.map((r) => [
          r.motoboy.nome,
          `${r.totalHoras.toFixed(1)}h`,
          r.totalCorridas.toString(),
          `${r.totalCorridasAte5km} | ${r.totalCorridasAcima5km}`,
          `R$ ${r.valorBruto.toFixed(2)}`,
          `R$ ${r.totalAdiantamentos.toFixed(2)}`,
          `R$ ${r.valorLiquido.toFixed(2)}`
        ]);
        autoTable(doc, {
          head: [["Motoboy", "Horas", "Corridas", "\u22645km | >5km", "Valor Bruto", "Adiantamentos", "Valor L\xEDquido"]],
          body: tableData,
          startY: currentY,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [66, 139, 202] }
        });
      } else {
        doc.setFontSize(16);
        doc.text("EXPRESSO NEVES - RELAT\xD3RIO DE MOTOBOYS POR LOJA", 20, currentY);
        currentY += 10;
        doc.setFontSize(12);
        doc.text(`Per\xEDodo: ${weekStart.toLocaleDateString("pt-BR")} a ${weekEnd.toLocaleDateString("pt-BR")}`, 20, currentY);
        currentY += 15;
        lojas.forEach((loja, index) => {
          const motoboysDaLoja = dados.filter((r) => {
            const jornadasDoMotoboy = jornadasSemana.filter((j) => j.motoboyId === r.motoboy.id && j.lojaId === loja.id);
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
            const tableData = motoboysDaLoja.map((r) => [
              r.motoboy.nome,
              `${r.totalHoras.toFixed(1)}h`,
              r.totalCorridas.toString(),
              `${r.totalCorridasAte5km} | ${r.totalCorridasAcima5km}`,
              `R$ ${r.valorBruto.toFixed(2)}`,
              `R$ ${r.totalAdiantamentos.toFixed(2)}`,
              `R$ ${r.valorLiquido.toFixed(2)}`
            ]);
            autoTable(doc, {
              head: [["Motoboy", "Horas", "Corridas", "\u22645km | >5km", "Valor Bruto", "Adiantamentos", "Valor L\xEDquido"]],
              body: tableData,
              startY: currentY,
              styles: { fontSize: 9 },
              headStyles: { fillColor: [66, 139, 202] }
            });
          }
        });
      }
      doc.save(`relatorio_motoboys_${weekStart.toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`);
    };
    const exportarRelatorioLojasCSV = () => {
      const dados = relatorioLojas.filter((r) => r.temAtividade);
      if (dados.length === 0) {
        alert("Nenhum dado para exportar no per\xEDodo selecionado.");
        return;
      }
      let csvContent = "";
      dados.forEach((relatorio) => {
        csvContent += `
EXPRESSO NEVES - RELAT\xD3RIO DA LOJA: ${relatorio.loja.nome}
`;
        csvContent += `Per\xEDodo: ${weekStart.toLocaleDateString("pt-BR")} a ${weekEnd.toLocaleDateString("pt-BR")}
`;
        csvContent += `CNPJ: ${relatorio.loja.cnpj}
`;
        csvContent += `Contato: ${relatorio.loja.contato}

`;
        csvContent += `RESUMO FINANCEIRO:
`;
        csvContent += `Valor Log\xEDstica,R$ ${relatorio.valorLogistica.toFixed(2)}
`;
        csvContent += `Taxa Administrativa,R$ ${relatorio.comissaoAdministrativa.toFixed(2)}
`;
        csvContent += `Taxa Supervis\xE3o,R$ ${relatorio.taxaSupervisao.toFixed(2)}
`;
        csvContent += `TOTAL,R$ ${relatorio.valorTotal.toFixed(2)}

`;
        csvContent += `DETALHAMENTO POR MOTOBOY:
`;
        csvContent += `Motoboy,Total Horas,Jornadas,Corridas \u22645km,Corridas >5km,Valor Corridas,Extras,Total Pago
`;
        const motoboyConsolidadoCSV = {};
        relatorio.jornadasLoja.forEach((jornada) => {
          const motoboy = motoboys.find((m) => m.id === jornada.motoboyId);
          const motoboyNome = motoboy?.nome || "N/A";
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
          motoboyConsolidadoCSV[jornada.motoboyId].totalCorridasAte5km += jornada.corridasAte5km || 0;
          motoboyConsolidadoCSV[jornada.motoboyId].totalCorridasAcima5km += jornada.corridasAcima5km || 0;
          motoboyConsolidadoCSV[jornada.motoboyId].totalValorCorridas += detalhes.valorCorridas;
          motoboyConsolidadoCSV[jornada.motoboyId].totalExtras += totalExtras;
          motoboyConsolidadoCSV[jornada.motoboyId].totalPago += detalhes.valorTotal;
        });
        Object.values(motoboyConsolidadoCSV).forEach((motoboy) => {
          csvContent += `${motoboy.nome},${motoboy.totalHoras.toFixed(1)}h,${motoboy.totalJornadas},${motoboy.totalCorridasAte5km},${motoboy.totalCorridasAcima5km},R$ ${motoboy.totalValorCorridas.toFixed(2)},R$ ${motoboy.totalExtras.toFixed(2)},R$ ${motoboy.totalPago.toFixed(2)}
`;
        });
        csvContent += `
${"=".repeat(80)}
`;
      });
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio_detalhado_lojas_${weekStart.toLocaleDateString("pt-BR").replace(/\//g, "-")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };
    const exportarRelatorioLojasPDF = () => {
      const dados = relatorioLojas.filter((r) => r.temAtividade);
      if (dados.length === 0) {
        alert("Nenhum dado para exportar no per\xEDodo selecionado.");
        return;
      }
      const doc = new jsPDF();
      let currentY = 20;
      dados.forEach((relatorio, index) => {
        if (index > 0) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFontSize(16);
        doc.text(`EXPRESSO NEVES - RELAT\xD3RIO DA LOJA: ${relatorio.loja.nome}`, 20, currentY);
        currentY += 10;
        doc.setFontSize(12);
        doc.text(`Per\xEDodo: ${weekStart.toLocaleDateString("pt-BR")} a ${weekEnd.toLocaleDateString("pt-BR")}`, 20, currentY);
        currentY += 7;
        doc.text(`CNPJ: ${relatorio.loja.cnpj}`, 20, currentY);
        currentY += 7;
        doc.text(`Contato: ${relatorio.loja.contato}`, 20, currentY);
        currentY += 15;
        doc.setFontSize(14);
        doc.text("RESUMO FINANCEIRO:", 20, currentY);
        currentY += 10;
        doc.setFontSize(12);
        doc.text(`Valor Log\xEDstica: R$ ${relatorio.valorLogistica.toFixed(2)}`, 30, currentY);
        currentY += 7;
        doc.text(`Taxa Administrativa: R$ ${relatorio.comissaoAdministrativa.toFixed(2)}`, 30, currentY);
        currentY += 7;
        doc.text(`Taxa Supervis\xE3o: R$ ${relatorio.taxaSupervisao.toFixed(2)}`, 30, currentY);
        currentY += 7;
        doc.setFontSize(14);
        doc.text(`TOTAL A PAGAR: R$ ${relatorio.valorTotal.toFixed(2)}`, 30, currentY);
        currentY += 15;
        doc.setFontSize(14);
        doc.text("DETALHAMENTO POR MOTOBOY:", 20, currentY);
        currentY += 10;
        const motoboyConsolidado = {};
        relatorio.jornadasLoja.forEach((jornada) => {
          const motoboy = motoboys.find((m) => m.id === jornada.motoboyId);
          const motoboyNome = motoboy?.nome || "N/A";
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
          motoboyConsolidado[jornada.motoboyId].totalCorridasAte5km += jornada.corridasAte5km || 0;
          motoboyConsolidado[jornada.motoboyId].totalCorridasAcima5km += jornada.corridasAcima5km || 0;
          motoboyConsolidado[jornada.motoboyId].totalValorCorridas += detalhes.valorCorridas;
          motoboyConsolidado[jornada.motoboyId].totalExtras += totalExtras;
          motoboyConsolidado[jornada.motoboyId].totalPago += detalhes.valorTotal;
        });
        const tableData = Object.values(motoboyConsolidado).map((motoboy) => [
          motoboy.nome,
          `${motoboy.totalHoras.toFixed(1)}h`,
          motoboy.totalJornadas.toString(),
          motoboy.totalCorridasAte5km.toString(),
          motoboy.totalCorridasAcima5km.toString(),
          `R$ ${motoboy.totalValorCorridas.toFixed(2)}`,
          `R$ ${motoboy.totalExtras.toFixed(2)}`,
          `R$ ${motoboy.totalPago.toFixed(2)}`
        ]);
        tableData.push([
          "TOTAL LOG\xCDSTICA:",
          "",
          "",
          "",
          "",
          "",
          "",
          `R$ ${relatorio.valorLogistica.toFixed(2)}`
        ]);
        autoTable(doc, {
          head: [["Motoboy", "Total Horas", "Jornadas", "\u22645km", ">5km", "Corridas", "Extras", "Total"]],
          body: tableData,
          startY: currentY,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] },
          margin: { left: 20, right: 20 }
        });
      });
      doc.save(`relatorio_detalhado_lojas_${weekStart.toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`);
    };
    const calcularDetalhesJornada = (jornada) => {
      if (!jornada) return { horasTrabalhadas: 0, valorDiaria: 0, valorCorridas: 0, valorComissoes: 0, valorMissoes: 0, valorTotal: 0 };
      const loja = lojas.find((l) => l.id === jornada.lojaId);
      if (!loja) return { horasTrabalhadas: 0, valorDiaria: 0, valorCorridas: 0, valorComissoes: 0, valorMissoes: 0, valorTotal: 0 };
      const horasTrabalhadas = calcularHorasTrabalhadas(jornada.horasEntrada, jornada.horasSaida);
      const valorDiaria = Number(jornada.valorDiaria) || 0;
      const corridasAte5km = Number(jornada.corridasAte5km) || 0;
      const corridasAcima5km = Number(jornada.corridasAcima5km) || 0;
      const valorCorridaAte5km = Number(loja.valorCorridaAte5km) || 0;
      const valorCorridaAcima5km = Number(loja.valorCorridaAcima5km) || 0;
      const valorCorridas = corridasAte5km * valorCorridaAte5km + corridasAcima5km * valorCorridaAcima5km;
      const valorComissoes = Number(jornada.comissoes) || 0;
      const valorMissoes = Number(jornada.missoes) || 0;
      const valorTotal = valorDiaria + valorCorridas + valorComissoes + valorMissoes;
      return { horasTrabalhadas, valorDiaria, valorCorridas, valorComissoes, valorMissoes, valorTotal: isNaN(valorTotal) ? 0 : valorTotal };
    };
    const lojasParaRelatorio = filtroLoja ? lojas.filter((l) => l.id === filtroLoja) : lojas;
    const relatorioMotoboys = motoboys.filter((m) => m.status === "ativo").map((motoboy) => {
      const jornadasMotoboy = jornadasSemana.filter((j) => j.motoboyId === motoboy.id);
      const adiantamentosMotoboy = adiantamentosSemana.filter((a) => a.motoboyId === motoboy.id);
      const totalHoras = jornadasMotoboy.reduce((sum, j) => {
        const horas = calcularHorasTrabalhadas(j.horasEntrada, j.horasSaida);
        return sum + (isNaN(horas) ? 0 : horas);
      }, 0);
      const totalCorridasAte5km = jornadasMotoboy.reduce((sum, j) => sum + (Number(j.corridasAte5km) || 0), 0);
      const totalCorridasAcima5km = jornadasMotoboy.reduce((sum, j) => sum + (Number(j.corridasAcima5km) || 0), 0);
      const totalCorridas = totalCorridasAte5km + totalCorridasAcima5km;
      const valorBruto = jornadasMotoboy.reduce((sum, j) => {
        const valorJornada = calcularValorJornada(j);
        return sum + (isNaN(valorJornada) || valorJornada < 0 ? 0 : valorJornada);
      }, 0);
      const totalAdiantamentos = adiantamentosMotoboy.reduce((sum, a) => {
        const valorAdiantamento = Number(a.valor) || 0;
        return sum + (valorAdiantamento < 0 ? 0 : valorAdiantamento);
      }, 0);
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
    const relatorioLojas = lojasParaRelatorio.map((loja) => {
      const jornadasLoja = jornadasSemana.filter((j) => j.lojaId === loja.id);
      const valorLogistica = jornadasLoja.reduce((sum, j) => {
        const valorJornada = calcularValorJornada(j);
        return sum + (isNaN(valorJornada) || valorJornada < 0 ? 0 : valorJornada);
      }, 0);
      const taxaAdministrativa = Number(loja.taxaAdministrativa) || 0;
      const taxaSupervisao = jornadasLoja.length > 0 ? Number(loja.taxaSupervisao) || 0 : 0;
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
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-bold" }, "Relat\xF3rios Semanais"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row gap-2 items-center" }, /* @__PURE__ */ React.createElement("label", { className: "text-sm font-medium" }, "Semana:"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "date",
        value: selectedWeek,
        onChange: (e) => setSelectedWeek(e.target.value),
        className: "border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
      }
    ), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-500 ml-2" }, weekStart.toLocaleDateString("pt-BR"), " a ", weekEnd.toLocaleDateString("pt-BR")))), currentUser?.tipo !== "lojista" && /* @__PURE__ */ React.createElement("div", { className: "bg-gray-50 p-4 rounded-lg" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row gap-4 items-start sm:items-center" }, /* @__PURE__ */ React.createElement("label", { className: "text-sm font-medium text-gray-700" }, "Filtrar por Loja:"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: filtroLoja,
        onChange: (e) => setFiltroLoja(e.target.value),
        className: "border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
      },
      /* @__PURE__ */ React.createElement("option", { value: "" }, "Todas as Lojas"),
      lojas.filter((loja) => canAccessLoja(loja.id)).map((loja) => /* @__PURE__ */ React.createElement("option", { key: loja.id, value: loja.id }, loja.nome))
    ), filtroLoja && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setFiltroLoja(""),
        className: "text-sm text-blue-600 hover:text-blue-800 underline"
      },
      "Limpar filtro"
    ))), currentUser?.tipo === "lojista" && /* @__PURE__ */ React.createElement("div", { className: "bg-blue-50 p-4 rounded-lg" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm text-blue-800" }, /* @__PURE__ */ React.createElement("strong", null, "Visualizando dados da loja:"), " ", lojas.find((l) => l.id === currentUser.lojaId)?.nome || "Loja n\xE3o encontrada"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-blue-50 border border-blue-200 p-4 rounded-lg" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-blue-800" }, "Motoboys com Atividade"), /* @__PURE__ */ React.createElement("p", { className: "text-xl font-bold text-blue-600" }, relatorioMotoboys.filter((r) => r.temAtividade).length)), /* @__PURE__ */ React.createElement("div", { className: "bg-green-50 border border-green-200 p-4 rounded-lg" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-green-800" }, "Lojas com Atividade"), /* @__PURE__ */ React.createElement("p", { className: "text-xl font-bold text-green-600" }, relatorioLojas.filter((r) => r.temAtividade).length)), /* @__PURE__ */ React.createElement("div", { className: "bg-purple-50 border border-purple-200 p-4 rounded-lg" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-medium text-purple-800" }, "Total de Jornadas"), /* @__PURE__ */ React.createElement("p", { className: "text-xl font-bold text-purple-600" }, jornadasSemana.length))), /* @__PURE__ */ React.createElement("div", { className: "bg-white border rounded-lg p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-4" }, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-semibold" }, "Relat\xF3rio de Motoboys"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: exportarRelatorioMotoboyCSV,
        className: "flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
      },
      /* @__PURE__ */ React.createElement(Download, { size: 16 }),
      "CSV"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: exportarRelatorioMotoboyPDF,
        className: "flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
      },
      /* @__PURE__ */ React.createElement(Download, { size: 16 }),
      "PDF"
    ))), /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-gray-50" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Motoboy"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Total Horas"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Total Corridas"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "\u22645km | >5km"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Valor Bruto"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Adiantamentos"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-700" }, "Valor L\xEDquido"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-gray-200" }, relatorioMotoboys.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "7", className: "px-4 py-8 text-center text-gray-500" }, "Nenhum motoboy ativo cadastrado")) : relatorioMotoboys.filter((r) => r.temAtividade).length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "7", className: "px-4 py-8 text-center text-gray-500" }, "Nenhuma atividade registrada para o per\xEDodo selecionado")) : relatorioMotoboys.filter((r) => r.temAtividade).map((relatorio) => /* @__PURE__ */ React.createElement("tr", { key: relatorio.motoboy.id, className: "hover:bg-gray-50" }, /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, relatorio.motoboy.nome), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, relatorio.totalHoras.toFixed(1), "h"), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, relatorio.totalCorridas), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, relatorio.totalCorridasAte5km, " | ", relatorio.totalCorridasAcima5km), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, "R$ ", relatorio.valorBruto.toFixed(2)), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3" }, "R$ ", relatorio.totalAdiantamentos.toFixed(2)), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 font-semibold" }, "R$ ", relatorio.valorLiquido.toFixed(2)))))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white border rounded-lg p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-4" }, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-semibold" }, "Relat\xF3rio Detalhado de Lojas"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: exportarRelatorioLojasCSV,
        className: "flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
      },
      /* @__PURE__ */ React.createElement(Download, { size: 16 }),
      "CSV"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: exportarRelatorioLojasPDF,
        className: "flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
      },
      /* @__PURE__ */ React.createElement(Download, { size: 16 }),
      "PDF"
    ))), relatorioLojas.filter((r) => r.temAtividade).length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "text-center text-gray-500 py-8" }, filtroLoja ? "Nenhuma atividade registrada para a loja selecionada no per\xEDodo." : "Nenhuma atividade registrada para o per\xEDodo selecionado.") : /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, relatorioLojas.filter((r) => r.temAtividade).map((relatorio) => /* @__PURE__ */ React.createElement("div", { key: relatorio.loja.id, className: "border rounded-lg p-4 bg-gray-50" }, /* @__PURE__ */ React.createElement("div", { className: "mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start mb-2" }, /* @__PURE__ */ React.createElement("h4", { className: "text-lg font-semibold text-gray-800" }, relatorio.loja.nome), /* @__PURE__ */ React.createElement("div", { className: "text-sm text-gray-600" }, "Per\xEDodo: ", weekStart.toLocaleDateString("pt-BR"), " a ", weekEnd.toLocaleDateString("pt-BR"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600" }, /* @__PURE__ */ React.createElement("div", null, "CNPJ: ", relatorio.loja.cnpj), /* @__PURE__ */ React.createElement("div", null, "Contato: ", relatorio.loja.contato))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-blue-50 p-3 rounded border" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs text-blue-600 font-medium" }, "LOG\xCDSTICA"), /* @__PURE__ */ React.createElement("div", { className: "text-lg font-bold text-blue-800" }, "R$ ", relatorio.valorLogistica.toFixed(2))), /* @__PURE__ */ React.createElement("div", { className: "bg-yellow-50 p-3 rounded border" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs text-yellow-600 font-medium" }, "TAXA ADMIN"), /* @__PURE__ */ React.createElement("div", { className: "text-lg font-bold text-yellow-800" }, "R$ ", relatorio.comissaoAdministrativa.toFixed(2))), /* @__PURE__ */ React.createElement("div", { className: "bg-purple-50 p-3 rounded border" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs text-purple-600 font-medium" }, "SUPERVIS\xC3O"), /* @__PURE__ */ React.createElement("div", { className: "text-lg font-bold text-purple-800" }, "R$ ", relatorio.taxaSupervisao.toFixed(2))), /* @__PURE__ */ React.createElement("div", { className: "bg-red-50 p-3 rounded border border-red-300" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs text-red-600 font-medium" }, "TOTAL A PAGAR"), /* @__PURE__ */ React.createElement("div", { className: "text-xl font-bold text-red-800" }, "R$ ", relatorio.valorTotal.toFixed(2)))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h5", { className: "font-medium text-gray-700 mb-2" }, "Detalhamento por Motoboy:"), /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-sm" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-white" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-left text-xs font-medium text-gray-600" }, "Motoboy"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-left text-xs font-medium text-gray-600" }, "Total Horas"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-left text-xs font-medium text-gray-600" }, "Jornadas"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-left text-xs font-medium text-gray-600" }, "\u22645km"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-left text-xs font-medium text-gray-600" }, ">5km"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-left text-xs font-medium text-gray-600" }, "Valor Corridas"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-left text-xs font-medium text-gray-600" }, "Extras"), /* @__PURE__ */ React.createElement("th", { className: "px-3 py-2 text-left text-xs font-medium text-gray-600" }, "Total Pago"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-gray-200" }, (() => {
      const motoboyConsolidado = {};
      relatorio.jornadasLoja.forEach((jornada) => {
        const motoboy = motoboys.find((m) => m.id === jornada.motoboyId);
        const motoboyNome = motoboy?.nome || "N/A";
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
        motoboyConsolidado[jornada.motoboyId].totalCorridasAte5km += jornada.corridasAte5km || 0;
        motoboyConsolidado[jornada.motoboyId].totalCorridasAcima5km += jornada.corridasAcima5km || 0;
        motoboyConsolidado[jornada.motoboyId].totalValorCorridas += detalhes.valorCorridas;
        motoboyConsolidado[jornada.motoboyId].totalExtras += totalExtras;
        motoboyConsolidado[jornada.motoboyId].totalPago += detalhes.valorTotal;
      });
      return Object.values(motoboyConsolidado).map((motoboy, index) => /* @__PURE__ */ React.createElement("tr", { key: index, className: "hover:bg-white" }, /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 font-medium" }, motoboy.nome), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2" }, motoboy.totalHoras.toFixed(1), "h"), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2" }, motoboy.totalJornadas), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2" }, motoboy.totalCorridasAte5km), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2" }, motoboy.totalCorridasAcima5km), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 text-green-600" }, "R$ ", motoboy.totalValorCorridas.toFixed(2)), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 text-purple-600" }, "R$ ", motoboy.totalExtras.toFixed(2)), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2 font-medium" }, "R$ ", motoboy.totalPago.toFixed(2))));
    })(), /* @__PURE__ */ React.createElement("tr", { className: "bg-gray-100 font-medium" }, /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2", colSpan: "7" }, "TOTAL LOG\xCDSTICA:"), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2" }, "R$ ", relatorio.valorLogistica.toFixed(2)))))), /* @__PURE__ */ React.createElement("div", { className: "mt-4 p-4 bg-red-50 border border-red-200 rounded" }, /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm text-gray-600 mb-1" }, "VALOR TOTAL A PAGAR PELA LOJA:"), /* @__PURE__ */ React.createElement("div", { className: "text-2xl font-bold text-red-800" }, "R$ ", relatorio.valorTotal.toFixed(2)), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500 mt-2" }, "(Log\xEDstica: R$ ", relatorio.valorLogistica.toFixed(2), " + Taxa Admin: R$ ", relatorio.comissaoAdministrativa.toFixed(2), " + Supervis\xE3o: R$ ", relatorio.taxaSupervisao.toFixed(2), ")")))))))));
  };
  const getAvailableTabs = () => {
    const allTabs = [
      { id: "dashboard", label: "Dashboard", icon: FileText, component: Dashboard, permission: "viewDashboard" },
      { id: "motoboys", label: "Motoboys", icon: Users, component: MotoboysTab, permission: "manageMotoboys" },
      { id: "lojas", label: "Lojas", icon: Store, component: LojasTab, permission: "manageLojas" },
      { id: "jornadas", label: "Jornadas", icon: Calendar, component: JornadasTab, permission: "manageJornadas" },
      { id: "adiantamentos", label: "Adiantamentos", icon: DollarSign, component: AdiantamentosTab, permission: "manageAdiantamentos" },
      { id: "relatorios", label: "Relat\xF3rios", icon: FileText, component: RelatoriosTab, permission: "viewRelatorios" },
      { id: "colaboradores", label: "Colaboradores", icon: Users, component: ColaboradoresTab, permission: "manageColaboradores" }
    ];
    return allTabs.filter((tab) => hasPermission(tab.permission));
  };
  const tabs = getAvailableTabs();
  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component || Dashboard;
  if (!isAuthenticated || !currentUser) {
    return /* @__PURE__ */ React.createElement(LoginScreen, null);
  }
  return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col h-screen bg-gray-100" }, /* @__PURE__ */ React.createElement("header", { className: "bg-white shadow-sm border-b" }, /* @__PURE__ */ React.createElement("div", { className: "px-4 py-3 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement(
    "img",
    {
      src: "assets/JeFG5upo7Hg6wrzGnryGF.jpeg",
      alt: "Expresso Neves",
      className: "h-12 w-auto"
    }
  ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-xl font-bold text-gray-900" }, "Expresso Neves"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600" }, "Sistema de Gest\xE3o de Motoboys"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-right" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-medium text-gray-900" }, currentUser?.nome), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500" }, currentUser?.tipo === "admin" && "Administrador", currentUser?.tipo === "financeiro" && "Financeiro", currentUser?.tipo === "lojista" && "Lojista", currentUser?.tipo === "lojista" && currentUser?.lojaId && ` - ${lojas.find((l) => l.id === currentUser.lojaId)?.nome || "Loja n\xE3o encontrada"}`)), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: logout,
      className: "flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors",
      title: "Sair"
    },
    /* @__PURE__ */ React.createElement(Settings, { size: 20 }),
    "Sair"
  )))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-1 overflow-hidden" }, /* @__PURE__ */ React.createElement("nav", { className: "w-64 bg-white shadow-sm border-r overflow-y-auto" }, /* @__PURE__ */ React.createElement("div", { className: "p-4" }, /* @__PURE__ */ React.createElement("ul", { className: "space-y-2" }, tabs.map((tab) => {
    const Icon = tab.icon;
    return /* @__PURE__ */ React.createElement("li", { key: tab.id }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setActiveTab(tab.id),
        className: `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === tab.id ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-gray-700 hover:bg-gray-50"}`
      },
      /* @__PURE__ */ React.createElement(Icon, { size: 20 }),
      tab.label
    ));
  })))), /* @__PURE__ */ React.createElement("main", { className: "flex-1 overflow-y-auto p-6" }, /* @__PURE__ */ React.createElement(ActiveComponent, null))), /* @__PURE__ */ React.createElement(MotoboyModal, null), /* @__PURE__ */ React.createElement(LojaModal, null), /* @__PURE__ */ React.createElement(JornadaModal, null), /* @__PURE__ */ React.createElement(AdiantamentoModal, null), /* @__PURE__ */ React.createElement(ColaboradorModal, null));
};
var stdin_default = MotoboysSystem;
export {
  stdin_default as default
};
