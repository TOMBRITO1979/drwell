import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Users, FileText, Building2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    clients: 0,
    cases: 0,
    companies: 0,
  });

  useEffect(() => {
    loadStats();
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Atividades Recentes</h2>
          <p className="text-gray-600">Nenhuma atividade recente.</p>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
