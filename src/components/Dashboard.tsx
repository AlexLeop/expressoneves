import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  BuildingStorefrontIcon, 
  UserGroupIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

export function Dashboard() {
  const { lojas, motoboys, jornadas, adiantamentos } = useApp();

  const motoboyAtivos = motoboys.filter(m => m.status === 'ativo').length;
  const adiantamentosPendentes = adiantamentos.filter(a => a.status === 'pendente').length;
  
  // Jornadas do mês atual
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const jornadasMesAtual = jornadas.filter(j => {
    const jornadaDate = new Date(j.data);
    return jornadaDate.getMonth() === currentMonth && jornadaDate.getFullYear() === currentYear;
  });

  const totalDiariasMes = jornadasMesAtual.reduce((sum, j) => sum + j.valorDiaria, 0);
  const totalCorridasMes = jornadasMesAtual.reduce((sum, j) => sum + j.corridasAte5km + j.corridasAcima5km, 0);

  const stats = [
    {
      name: 'Lojas Cadastradas',
      value: lojas.length,
      icon: BuildingStorefrontIcon,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      name: 'Motoboys Ativos',
      value: motoboyAtivos,
      icon: UserGroupIcon,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      name: 'Jornadas Este Mês',
      value: jornadasMesAtual.length,
      icon: ClockIcon,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      name: 'Adiantamentos Pendentes',
      value: adiantamentosPendentes,
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    }
  ];

  const recentJornadas = jornadas
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumo Financeiro */}
        <div className="card">
          <div className="flex items-center mb-4">
            <ChartBarIcon className="h-6 w-6 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Resumo Financeiro - Este Mês</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total em Diárias:</span>
              <span className="font-semibold text-green-600">
                R$ {totalDiariasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total de Corridas:</span>
              <span className="font-semibold text-blue-600">{totalCorridasMes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Média por Jornada:</span>
              <span className="font-semibold text-purple-600">
                R$ {jornadasMesAtual.length > 0 
                  ? (totalDiariasMes / jornadasMesAtual.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                  : '0,00'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Jornadas Recentes */}
        <div className="card">
          <div className="flex items-center mb-4">
            <CalendarDaysIcon className="h-6 w-6 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Jornadas Recentes</h3>
          </div>
          <div className="space-y-3">
            {recentJornadas.length > 0 ? (
              recentJornadas.map((jornada) => {
                const motoboy = motoboys.find(m => m.id === jornada.motoboyId);
                const loja = lojas.find(l => l.id === jornada.lojaId);
                return (
                  <div key={jornada.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{motoboy?.nome}</p>
                      <p className="text-sm text-gray-500">{loja?.nome}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {new Date(jornada.data).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-sm text-green-600">
                        R$ {jornada.valorDiaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhuma jornada registrada</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left">
            <UserGroupIcon className="h-8 w-8 text-primary-600 mb-2" />
            <h4 className="font-medium text-gray-900">Cadastrar Motoboy</h4>
            <p className="text-sm text-gray-500">Adicionar novo motoboy ao sistema</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left">
            <ClockIcon className="h-8 w-8 text-primary-600 mb-2" />
            <h4 className="font-medium text-gray-900">Registrar Jornada</h4>
            <p className="text-sm text-gray-500">Lançar nova jornada de trabalho</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left">
            <CurrencyDollarIcon className="h-8 w-8 text-primary-600 mb-2" />
            <h4 className="font-medium text-gray-900">Solicitar Adiantamento</h4>
            <p className="text-sm text-gray-500">Criar solicitação de adiantamento</p>
          </button>
        </div>
      </div>
    </div>
  );
}