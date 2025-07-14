export interface Loja {
  id: string;
  nome: string;
  cnpj: string;
  contato: string;
  valorCorridaAte5km: number;
  valorCorridaAcima5km: number;
  taxaAdministrativa: number;
  taxaSupervisao: number;
}

export interface Motoboy {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  valorDiariaPadrao?: number;
  valorDiariaDomFeriado?: number;
  status: 'ativo' | 'inativo';
}

export interface Jornada {
  id: string;
  data: string;
  motoboyId: string;
  lojaId: string;
  horasEntrada: string;
  horasSaida: string;
  valorDiaria: number;
  corridasAte5km: number;
  corridasAcima5km: number;
  comissoes: number;
  missoes: number;
  eFeriado: boolean;
  observacoes: string;
}

export interface Adiantamento {
  id: string;
  motoboyId: string;
  lojaId: string;
  valor: number;
  data: string;
  descricao: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  dataAprovacao?: string;
  aprovadoPor?: string;
}

export interface Colaborador {
  id: string;
  nome: string;
  email: string;
  senha: string;
  tipo: 'admin' | 'operador';
  lojaId: string | null;
  ativo: boolean;
  dataCriacao: string;
}

export interface AppState {
  lojas: Loja[];
  motoboys: Motoboy[];
  jornadas: Jornada[];
  adiantamentos: Adiantamento[];
  colaboradores: Colaborador[];
  currentUser: Colaborador | null;
  isAuthenticated: boolean;
}