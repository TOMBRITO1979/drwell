import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Users, FileText, Building2, UserPlus, FolderPlus, DollarSign, Activity } from 'lucide-react';

interface RecentActivity {
  id: string;
  type: 'client' | 'case' | 'transaction';
  description: string;
  date: string;
  icon: React.ReactNode;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    clients: 0,
    cases: 0,
    companies: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadStats();
    loadRecentActivities();
  }, []);

  const loadStats = async () => {
    try {
      // Busca estatísticas básicas
      const [clientsRes, casesRes] = await Promise.all([
        api.get('/clients?limit=1'),
        api.get('/cases?limit=1'),
      ]);

      setStats({
        clients: clientsRes.data.pagination?.total || 0,
        cases: casesRes.data.pagination?.total || 0,
        companies: 0,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const loadRecentActivities = async () => {
    try {
      const activities: RecentActivity[] = [];

      // Busca últimos clientes (3 mais recentes)
      const clientsRes = await api.get('/clients?limit=3&sort=createdAt:desc');
      if (clientsRes.data.clients) {
        clientsRes.data.clients.forEach((client: any) => {
          activities.push({
            id: `client-${client.id}`,
            type: 'client',
            description: `Cliente cadastrado: ${client.name}`,
            date: client.createdAt,
            icon: <UserPlus className="text-blue-600" size={20} />,
          });
        });
      }

      // Busca últimos processos (3 mais recentes)
      const casesRes = await api.get('/cases?limit=3&sort=createdAt:desc');
      if (casesRes.data.cases) {
        casesRes.data.cases.forEach((caseItem: any) => {
          activities.push({
            id: `case-${caseItem.id}`,
            type: 'case',
            description: `Processo criado: ${caseItem.processNumber || caseItem.subject || 'Sem número'}`,
            date: caseItem.createdAt,
            icon: <FolderPlus className="text-green-600" size={20} />,
          });
        });
      }

      // Busca últimas transações financeiras (4 mais recentes)
      try {
        const financialRes = await api.get('/financial?limit=4');
        if (financialRes.data.transactions) {
          financialRes.data.transactions.forEach((transaction: any) => {
            const typeLabel = transaction.type === 'INCOME' ? 'Receita' : 'Despesa';
            const color = transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600';
            activities.push({
              id: `transaction-${transaction.id}`,
              type: 'transaction',
              description: `${typeLabel}: ${transaction.description}`,
              date: transaction.date || transaction.createdAt,
              icon: <DollarSign className={color} size={20} />,
            });
          });
        }
      } catch (err) {
        // Módulo financeiro pode não estar disponível, ignora erro
        console.log('Módulo financeiro não disponível');
      }

      // Ordena por data (mais recente primeiro) e pega os 8 mais recentes
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivities(activities.slice(0, 8));
    } catch (error) {
      console.error('Erro ao carregar atividades recentes:', error);
      setRecentActivities([]);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Agora mesmo';
      if (diffMins < 60) return `${diffMins} min atrás`;
      if (diffHours < 24) return `${diffHours}h atrás`;
      if (diffDays < 7) return `${diffDays}d atrás`;

      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Bem-vindo, {user?.name}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Clientes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.clients}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="text-blue-600" size={32} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Processos</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.cases}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <FileText className="text-green-600" size={32} />
              </div>
            </div>
          </div>

          {user?.role === 'SUPER_ADMIN' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Empresas</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.companies}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Building2 className="text-purple-600" size={32} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-gray-700" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">Atividades Recentes</h2>
          </div>

          {recentActivities.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma atividade recente.</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="mt-0.5">{activity.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(activity.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
