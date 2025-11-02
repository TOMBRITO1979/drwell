import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, RefreshCw, X, Calendar, User, FileText, Clock, Edit, Trash2 } from 'lucide-react';

interface Case {
  id: string;
  processNumber: string;
  court: string;
  subject: string;
  status: string;
  value?: number;
  notes?: string;
  client: {
    id: string;
    name: string;
    cpf?: string;
  };
  lastSyncedAt?: string;
  createdAt: string;
}

interface CaseMovement {
  id: string;
  movementCode: number;
  movementName: string;
  movementDate: string;
  description?: string;
}

interface CaseDetail extends Case {
  movements?: CaseMovement[];
  documents?: any[];
  parts?: CasePart[];
}

interface CasePart {
  id?: string;
  type: 'AUTOR' | 'REU' | 'REPRESENTANTE_LEGAL';
  name: string;
  cpfCnpj?: string;
  phone?: string;
  address?: string;
  email?: string;
  civilStatus?: string;
  profession?: string;
  rg?: string;
  birthDate?: string;
}

const Cases: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Autocomplete states
  const [clientSearchText, setClientSearchText] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const clientInputRef = useRef<HTMLInputElement>(null);

  // Parts management
  const [parts, setParts] = useState<CasePart[]>([]);
  const [showAddPartForm, setShowAddPartForm] = useState(false);
  const [partFormData, setPartFormData] = useState<CasePart>({
    type: 'AUTOR',
    name: '',
    cpfCnpj: '',
    phone: '',
    address: '',
    email: '',
    civilStatus: '',
    profession: '',
    rg: '',
    birthDate: '',
  });

  // Edit part modal states (for details modal)
  const [showEditPartModal, setShowEditPartModal] = useState(false);
  const [editingPart, setEditingPart] = useState<CasePart | null>(null);

  const [formData, setFormData] = useState({
    clientId: '',
    processNumber: '',
    court: '',
    subject: '',
    value: '',
    notes: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    loadCases();
    loadClients();
  }, [search]);

  // Filter clients based on search text
  useEffect(() => {
    if (clientSearchText) {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(clientSearchText.toLowerCase()) ||
        (client.cpf && client.cpf.includes(clientSearchText))
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [clientSearchText, clients]);

  const loadCases = async () => {
    try {
      const response = await api.get('/cases', {
        params: { search, limit: 50 },
      });
      setCases(response.data.data);
    } catch (error) {
      toast.error('Erro ao carregar processos');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await api.get('/clients', { params: { limit: 1000 } });
      setClients(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar clientes');
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      processNumber: '',
      court: '',
      subject: '',
      value: '',
      notes: '',
      status: 'ACTIVE',
    });
    setClientSearchText('');
    setParts([]);
    setPartFormData({
      type: 'AUTOR',
      name: '',
      cpfCnpj: '',
      phone: '',
      address: '',
      email: '',
      civilStatus: '',
      profession: '',
      rg: '',
    });
    setShowAddPartForm(false);
  };

  const handleClientSelect = (client: any) => {
    setFormData({ ...formData, clientId: client.id });
    setClientSearchText(client.name);
    setShowClientSuggestions(false);
  };

  const handleAddPart = () => {
    if (!partFormData.name || !partFormData.type) {
      toast.error('Nome e tipo são obrigatórios');
      return;
    }
    setParts([...parts, { ...partFormData }]);
    setPartFormData({
      type: 'AUTOR',
      name: '',
      cpfCnpj: '',
      phone: '',
      address: '',
      email: '',
      civilStatus: '',
      profession: '',
      rg: '',
    });
    setShowAddPartForm(false);
    toast.success('Parte adicionada!');
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        value: formData.value ? parseFloat(formData.value) : undefined,
      };

      let caseId: string;

      if (editMode && selectedCase) {
        await api.put(`/cases/${selectedCase.id}`, payload);
        caseId = selectedCase.id;
        toast.success('Processo atualizado com sucesso!');
      } else {
        const response = await api.post('/cases', payload);
        caseId = response.data.id;
        toast.success('Processo criado com sucesso!');
      }

      // Create or update parts if any were added
      if (parts.length > 0) {
        for (const part of parts) {
          try {
            if (part.id) {
              // Update existing part
              await api.put(`/cases/${caseId}/parts/${part.id}`, part);
            } else {
              // Create new part
              await api.post(`/cases/${caseId}/parts`, part);
            }
          } catch (error) {
            console.error('Erro ao salvar parte:', error);
          }
        }
      }

      setShowModal(false);
      setEditMode(false);
      setSelectedCase(null);
      resetForm();
      loadCases();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar processo');
    }
  };

  const handleSync = async (caseId: string) => {
    try {
      toast.loading('Sincronizando...', { id: 'sync' });
      await api.post(`/cases/${caseId}/sync`);
      toast.success('Processo sincronizado com sucesso!', { id: 'sync' });
      loadCases();
      // Se o modal de detalhes está aberto, recarrega os detalhes
      if (showDetailsModal && selectedCase?.id === caseId) {
        loadCaseDetails(caseId);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao sincronizar', { id: 'sync' });
    }
  };

  const loadCaseDetails = async (caseId: string) => {
    try {
      setLoadingDetails(true);
      const response = await api.get(`/cases/${caseId}`);
      setSelectedCase(response.data);
      setShowDetailsModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao carregar detalhes do processo');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCaseClick = (caseId: string) => {
    loadCaseDetails(caseId);
  };

  const handleEditPart = (part: CasePart) => {
    setEditingPart({ ...part });
    setShowEditPartModal(true);
  };

  const handleSaveEditedPart = async () => {
    if (!editingPart || !selectedCase) return;

    try {
      toast.loading('Salvando alterações...', { id: 'save-part' });

      await api.put(`/cases/${selectedCase.id}/parts/${editingPart.id}`, editingPart);

      // Reload case details
      await loadCaseDetails(selectedCase.id);

      toast.success('Parte atualizada com sucesso!', { id: 'save-part' });
      setShowEditPartModal(false);
      setEditingPart(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar parte', { id: 'save-part' });
    }
  };

  const handleEdit = async (caseItem: Case) => {
    try {
      // Load complete case details including parts
      const response = await api.get(`/cases/${caseItem.id}`);
      const caseDetail: CaseDetail = response.data;

      setSelectedCase(caseDetail);
      setFormData({
        clientId: caseDetail.client.id,
        processNumber: caseDetail.processNumber,
        court: caseDetail.court || '',
        subject: caseDetail.subject || '',
        value: caseDetail.value ? caseDetail.value.toString() : '',
        notes: caseDetail.notes || '',
        status: caseDetail.status || 'ACTIVE',
      });
      setClientSearchText(caseDetail.client.name);

      // Load parts if editing
      if (caseDetail.parts && caseDetail.parts.length > 0) {
        setParts(caseDetail.parts);
      } else {
        setParts([]);
      }

      setEditMode(true);
      setShowModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao carregar processo');
    }
  };

  const handleDelete = async (caseItem: Case) => {
    if (!window.confirm(`Tem certeza que deseja excluir o processo "${caseItem.processNumber}"?`)) {
      return;
    }

    try {
      await api.delete(`/cases/${caseItem.id}`);
      toast.success('Processo excluído com sucesso!');
      loadCases();
      if (showDetailsModal && selectedCase?.id === caseItem.id) {
        setShowDetailsModal(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao excluir processo');
    }
  };

  const handleNewCase = () => {
    resetForm();
    setEditMode(false);
    setSelectedCase(null);
    setShowModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Processos</h1>
          <button
            onClick={handleNewCase}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Plus size={20} />
            <span>Novo Processo</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar processos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {loading ? (
            <p className="text-center py-4">Carregando...</p>
          ) : cases.length === 0 ? (
            <p className="text-center py-4 text-gray-600">Nenhum processo encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Número
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Assunto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cases.map((caseItem) => (
                    <tr key={caseItem.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleCaseClick(caseItem.id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                          title="Ver detalhes do processo"
                        >
                          {caseItem.processNumber}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {caseItem.client.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{caseItem.subject}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {caseItem.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleSync(caseItem.id)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Sincronizar com DataJud"
                          >
                            <RefreshCw size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(caseItem)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(caseItem)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Criar/Editar Processo */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editMode ? 'Editar Processo' : 'Novo Processo'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditMode(false);
                  setSelectedCase(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cliente - Autocomplete */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente *
                </label>
                <input
                  ref={clientInputRef}
                  type="text"
                  required
                  placeholder="Digite o nome ou CPF do cliente..."
                  value={clientSearchText}
                  onChange={(e) => {
                    setClientSearchText(e.target.value);
                    setShowClientSuggestions(true);
                    setFormData({ ...formData, clientId: '' });
                  }}
                  onFocus={() => setShowClientSuggestions(true)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showClientSuggestions && filteredClients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => handleClientSelect(client)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        <p className="font-medium text-sm">{client.name}</p>
                        {client.cpf && <p className="text-xs text-gray-500">{client.cpf}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Número do Processo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 00008323520184013202"
                  value={formData.processNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, processNumber: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={editMode}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editMode ? 'O número do processo não pode ser alterado' : 'O sistema irá buscar automaticamente os dados no DataJud'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tribunal</label>
                  <input
                    type="text"
                    value={formData.court}
                    onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Assunto</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="ARCHIVED">Arquivado</option>
                  <option value="FINISHED">Finalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  placeholder="Observações adicionais sobre o processo..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Adicionar Partes */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-md font-semibold text-gray-900">Partes do Processo</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddPartForm(!showAddPartForm)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    <Plus size={16} />
                    <span>Adicionar Parte</span>
                  </button>
                </div>

                {/* Lista de Partes Adicionadas */}
                {parts.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {parts.map((part, index) => (
                      <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              part.type === 'AUTOR' ? 'bg-blue-100 text-blue-700' :
                              part.type === 'REU' ? 'bg-red-100 text-red-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {part.type === 'AUTOR' ? 'Autor' : part.type === 'REU' ? 'Réu' : 'Representante Legal'}
                            </span>
                            <span className="font-medium text-sm">{part.name}</span>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {part.cpfCnpj && <span>CPF/CNPJ: {part.cpfCnpj}</span>}
                            {part.phone && <span className="ml-2">Tel: {part.phone}</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePart(index)}
                          className="text-red-600 hover:text-red-800"
                          title="Remover parte"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulário Adicionar Parte */}
                {showAddPartForm && (
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                      <select
                        value={partFormData.type}
                        onChange={(e) => setPartFormData({ ...partFormData, type: e.target.value as any })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="AUTOR">Autor</option>
                        <option value="REU">Réu</option>
                        <option value="REPRESENTANTE_LEGAL">Representante Legal</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                        <input
                          type="text"
                          value={partFormData.name}
                          onChange={(e) => setPartFormData({ ...partFormData, name: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
                        <input
                          type="text"
                          value={partFormData.cpfCnpj}
                          onChange={(e) => setPartFormData({ ...partFormData, cpfCnpj: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                        <input
                          type="text"
                          value={partFormData.phone}
                          onChange={(e) => setPartFormData({ ...partFormData, phone: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                        <input
                          type="text"
                          value={partFormData.address}
                          onChange={(e) => setPartFormData({ ...partFormData, address: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Campos específicos para AUTOR */}
                    {partFormData.type === 'AUTOR' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                              type="email"
                              value={partFormData.email}
                              onChange={(e) => setPartFormData({ ...partFormData, email: e.target.value })}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado Civil</label>
                            <input
                              type="text"
                              value={partFormData.civilStatus}
                              onChange={(e) => setPartFormData({ ...partFormData, civilStatus: e.target.value })}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Profissão</label>
                            <input
                              type="text"
                              value={partFormData.profession}
                              onChange={(e) => setPartFormData({ ...partFormData, profession: e.target.value })}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
                            <input
                              type="text"
                              value={partFormData.rg}
                              onChange={(e) => setPartFormData({ ...partFormData, rg: e.target.value })}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddPartForm(false);
                          setPartFormData({
                            type: 'AUTOR',
                            name: '',
                            cpfCnpj: '',
                            phone: '',
                            address: '',
                            email: '',
                            civilStatus: '',
                            profession: '',
                            rg: '',
                          });
                        }}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleAddPart}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditMode(false);
                    setSelectedCase(null);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editMode ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes do Processo */}
      {showDetailsModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {loadingDetails ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">Carregando detalhes...</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedCase.processNumber}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedCase.court} • Criado em {formatDate(selectedCase.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Conteúdo */}
                <div className="p-6 space-y-6">
                  {/* Informações Principais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center text-gray-500 text-sm mb-1">
                          <User size={16} className="mr-2" />
                          <span>Cliente</span>
                        </div>
                        <p className="text-gray-900 font-medium">{selectedCase.client.name}</p>
                        {selectedCase.client.cpf && (
                          <p className="text-sm text-gray-500">CPF: {selectedCase.client.cpf}</p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center text-gray-500 text-sm mb-1">
                          <FileText size={16} className="mr-2" />
                          <span>Assunto</span>
                        </div>
                        <p className="text-gray-900">{selectedCase.subject}</p>
                      </div>

                      {selectedCase.value && (
                        <div>
                          <div className="flex items-center text-gray-500 text-sm mb-1">
                            <span className="mr-2">💰</span>
                            <span>Valor da Causa</span>
                          </div>
                          <p className="text-gray-900 font-semibold">
                            {formatCurrency(selectedCase.value)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center text-gray-500 text-sm mb-1">
                          <span className="mr-2">⚖️</span>
                          <span>Status</span>
                        </div>
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {selectedCase.status}
                        </span>
                      </div>

                      {selectedCase.lastSyncedAt && (
                        <div>
                          <div className="flex items-center text-gray-500 text-sm mb-1">
                            <Clock size={16} className="mr-2" />
                            <span>Última Sincronização</span>
                          </div>
                          <p className="text-gray-900">{formatDate(selectedCase.lastSyncedAt)}</p>
                        </div>
                      )}

                      <div>
                        <button
                          onClick={() => handleSync(selectedCase.id)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          <RefreshCw size={16} />
                          <span>Sincronizar Agora</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectedCase.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Observações</h3>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{selectedCase.notes}</p>
                    </div>
                  )}

                  {/* Partes Envolvidas */}
                  {selectedCase.parts && selectedCase.parts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Partes Envolvidas
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipo
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nome
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                CPF/CNPJ
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                RG
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nascimento
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ações
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedCase.parts.map((part) => {
                              const typeLabels = {
                                AUTOR: 'Autor',
                                REU: 'Réu',
                                REPRESENTANTE_LEGAL: 'Rep. Legal',
                              };

                              const typeBadgeColors = {
                                AUTOR: 'bg-blue-100 text-blue-800',
                                REU: 'bg-red-100 text-red-800',
                                REPRESENTANTE_LEGAL: 'bg-green-100 text-green-800',
                              };

                              return (
                                <tr key={part.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${typeBadgeColors[part.type]}`}>
                                      {typeLabels[part.type]}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {part.name}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {part.cpfCnpj || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {part.rg || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {part.birthDate ? new Date(part.birthDate).toLocaleDateString('pt-BR') : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <button
                                      onClick={() => handleEditPart(part)}
                                      className="text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                      Editar
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Timeline de Movimentações */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Andamento do Processo
                      </h3>
                      {selectedCase.movements && selectedCase.movements.length > 0 && (
                        <span className="text-sm text-gray-500">
                          {selectedCase.movements.length} movimentação(ões)
                        </span>
                      )}
                    </div>

                    {!selectedCase.movements || selectedCase.movements.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-600">Nenhuma movimentação registrada</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Clique em "Sincronizar Agora" para buscar atualizações
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Linha vertical da timeline */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                        {/* Movimentações */}
                        <div className="space-y-6">
                          {selectedCase.movements.map((movement, index) => (
                            <div key={movement.id} className="relative pl-12">
                              {/* Ponto na timeline */}
                              <div className="absolute left-2 top-1 w-4 h-4 bg-blue-600 rounded-full border-4 border-white"></div>

                              {/* Conteúdo da movimentação */}
                              <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium text-gray-900">
                                    {movement.movementName}
                                  </h4>
                                  <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                                    Código: {movement.movementCode}
                                  </span>
                                </div>

                                <div className="flex items-center text-sm text-gray-500 mb-2">
                                  <Calendar size={14} className="mr-1" />
                                  {formatDate(movement.movementDate)}
                                </div>

                                {movement.description && (
                                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                                    {movement.description}
                                  </p>
                                )}

                                {index === 0 && (
                                  <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    Mais recente
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleEdit(selectedCase as Case);
                      }}
                      className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Edit size={16} />
                      <span>Editar Processo</span>
                    </button>
                    <button
                      onClick={() => handleDelete(selectedCase as Case)}
                      className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={16} />
                      <span>Excluir Processo</span>
                    </button>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Edição de Parte */}
      {showEditPartModal && editingPart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Editar Parte</h2>
              <button
                onClick={() => {
                  setShowEditPartModal(false);
                  setEditingPart(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={editingPart.type}
                  onChange={(e) => setEditingPart({ ...editingPart, type: e.target.value as 'AUTOR' | 'REU' | 'REPRESENTANTE_LEGAL' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="AUTOR">Autor</option>
                  <option value="REU">Réu</option>
                  <option value="REPRESENTANTE_LEGAL">Representante Legal</option>
                </select>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={editingPart.name}
                  onChange={(e) => setEditingPart({ ...editingPart, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* CPF/CNPJ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF/CNPJ
                </label>
                <input
                  type="text"
                  value={editingPart.cpfCnpj || ''}
                  onChange={(e) => setEditingPart({ ...editingPart, cpfCnpj: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* RG */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RG
                </label>
                <input
                  type="text"
                  value={editingPart.rg || ''}
                  onChange={(e) => setEditingPart({ ...editingPart, rg: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Data de Nascimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={editingPart.birthDate ? editingPart.birthDate.split('T')[0] : ''}
                  onChange={(e) => setEditingPart({ ...editingPart, birthDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={editingPart.phone || ''}
                  onChange={(e) => setEditingPart({ ...editingPart, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email (apenas para AUTOR) */}
              {editingPart.type === 'AUTOR' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editingPart.email || ''}
                      onChange={(e) => setEditingPart({ ...editingPart, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado Civil
                    </label>
                    <input
                      type="text"
                      value={editingPart.civilStatus || ''}
                      onChange={(e) => setEditingPart({ ...editingPart, civilStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profissão
                    </label>
                    <input
                      type="text"
                      value={editingPart.profession || ''}
                      onChange={(e) => setEditingPart({ ...editingPart, profession: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Endereço */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <textarea
                  value={editingPart.address || ''}
                  onChange={(e) => setEditingPart({ ...editingPart, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditPartModal(false);
                  setEditingPart(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditedPart}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Cases;
