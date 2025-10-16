// API Configuration
const API_URL = window.location.origin;
let currentUser = null;

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/';
        return false;
    }
    return true;
}

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Logout
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    window.location.href = '/';
}

// Show section
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(el => {
        el.classList.add('hidden');
    });

    // Show selected section
    document.getElementById(`section-${section}`).classList.remove('hidden');

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'clients': 'Clientes',
        'processes': 'Processos Judiciais',
        'lawyers': 'Advogados',
        'law-firms': 'Escritórios de Advocacia'
    };
    document.getElementById('page-title').textContent = titles[section];

    // Load data for section
    if (section === 'clients') loadClients();
    if (section === 'processes') loadProcesses();
    if (section === 'lawyers') loadLawyers();
    if (section === 'law-firms') loadFirms();
}

// Load current user
async function loadCurrentUser() {
    try {
        const response = await fetch(`${API_URL}/api/v1/users/me`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            currentUser = await response.json();
            document.getElementById('user-name').textContent = currentUser.full_name || currentUser.username;
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

// Load dashboard stats
async function loadDashboardStats() {
    try {
        // Load clients count
        const clientsRes = await fetch(`${API_URL}/api/v1/clients/`, {
            headers: getAuthHeaders()
        });
        if (clientsRes.ok) {
            const clients = await clientsRes.json();
            document.getElementById('stats-clients').textContent = clients.length || 0;
        }

        // Load processes count
        const processesRes = await fetch(`${API_URL}/api/v1/processes/`, {
            headers: getAuthHeaders()
        });
        if (processesRes.ok) {
            const processes = await processesRes.json();
            document.getElementById('stats-processes').textContent = processes.length || 0;
        }

        // Load lawyers count
        const lawyersRes = await fetch(`${API_URL}/api/v1/lawyers/`, {
            headers: getAuthHeaders()
        });
        if (lawyersRes.ok) {
            const lawyers = await lawyersRes.json();
            document.getElementById('stats-lawyers').textContent = lawyers.length || 0;
        }

        // Load firms count
        const firmsRes = await fetch(`${API_URL}/api/v1/law-firms/`, {
            headers: getAuthHeaders()
        });
        if (firmsRes.ok) {
            const firms = await firmsRes.json();
            document.getElementById('stats-firms').textContent = firms.length || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load clients
async function loadClients() {
    const container = document.getElementById('clients-list');
    container.innerHTML = '<p class="text-gray-500 text-center py-8">Carregando...</p>';

    try {
        const response = await fetch(`${API_URL}/api/v1/clients/`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const clients = await response.json();

            if (clients.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum cliente cadastrado</p>';
                return;
            }

            container.innerHTML = clients.map(client => `
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="text-lg font-semibold text-gray-800">${client.full_name}</h4>
                            <p class="text-sm text-gray-600">${client.email || 'Sem email'}</p>
                            <p class="text-sm text-gray-600">${client.phone || 'Sem telefone'}</p>
                            ${client.cpf_cnpj ? `<p class="text-sm text-gray-600">CPF/CNPJ: ${client.cpf_cnpj}</p>` : ''}
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="viewClient(${client.id})" class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="editClient(${client.id})" class="text-green-600 hover:text-green-800">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteClient(${client.id})" class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-red-500 text-center py-8">Erro ao carregar clientes</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="text-red-500 text-center py-8">Erro de conexão</p>';
    }
}

// Load processes
async function loadProcesses() {
    const container = document.getElementById('processes-list');
    container.innerHTML = '<p class="text-gray-500 text-center py-8">Carregando...</p>';

    try {
        const response = await fetch(`${API_URL}/api/v1/processes/`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const processes = await response.json();

            if (processes.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum processo cadastrado</p>';
                return;
            }

            container.innerHTML = processes.map(process => `
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="text-lg font-semibold text-gray-800">${process.process_number}</h4>
                            <p class="text-sm text-gray-600">${process.subject || 'Sem assunto'}</p>
                            <p class="text-sm text-gray-600">Tribunal: ${process.court_type || 'N/A'}</p>
                            ${process.value ? `<p class="text-sm text-gray-600">Valor: R$ ${process.value.toFixed(2)}</p>` : ''}
                            <span class="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${
                                process.status === 'active' ? 'bg-green-100 text-green-800' :
                                process.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                            }">
                                ${process.status || 'pendente'}
                            </span>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="syncProcess(${process.id})" class="text-purple-600 hover:text-purple-800" title="Sincronizar com DataJud">
                                <i class="fas fa-sync"></i>
                            </button>
                            <button onclick="viewProcess(${process.id})" class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="editProcess(${process.id})" class="text-green-600 hover:text-green-800">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteProcess(${process.id})" class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-red-500 text-center py-8">Erro ao carregar processos</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="text-red-500 text-center py-8">Erro de conexão</p>';
    }
}

// Load lawyers
async function loadLawyers() {
    const container = document.getElementById('lawyers-list');
    container.innerHTML = '<p class="text-gray-500 text-center py-8">Carregando...</p>';

    try {
        const response = await fetch(`${API_URL}/api/v1/lawyers/`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const lawyers = await response.json();

            if (lawyers.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum advogado cadastrado</p>';
                return;
            }

            container.innerHTML = lawyers.map(lawyer => `
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="text-lg font-semibold text-gray-800">${lawyer.full_name}</h4>
                            <p class="text-sm text-gray-600">${lawyer.email || 'Sem email'}</p>
                            <p class="text-sm text-gray-600">OAB: ${lawyer.oab_number || 'N/A'}</p>
                            ${lawyer.cpf ? `<p class="text-sm text-gray-600">CPF: ${lawyer.cpf}</p>` : ''}
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="viewLawyer(${lawyer.id})" class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="editLawyer(${lawyer.id})" class="text-green-600 hover:text-green-800">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteLawyer(${lawyer.id})" class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-red-500 text-center py-8">Erro ao carregar advogados</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="text-red-500 text-center py-8">Erro de conexão</p>';
    }
}

// Load law firms
async function loadFirms() {
    const container = document.getElementById('firms-list');
    container.innerHTML = '<p class="text-gray-500 text-center py-8">Carregando...</p>';

    try {
        const response = await fetch(`${API_URL}/api/v1/law-firms/`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const firms = await response.json();

            if (firms.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum escritório cadastrado</p>';
                return;
            }

            container.innerHTML = firms.map(firm => `
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="text-lg font-semibold text-gray-800">${firm.name}</h4>
                            <p class="text-sm text-gray-600">${firm.email || 'Sem email'}</p>
                            ${firm.cnpj ? `<p class="text-sm text-gray-600">CNPJ: ${firm.cnpj}</p>` : ''}
                            ${firm.phone ? `<p class="text-sm text-gray-600">Tel: ${firm.phone}</p>` : ''}
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="viewFirm(${firm.id})" class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="editFirm(${firm.id})" class="text-green-600 hover:text-green-800">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteFirm(${firm.id})" class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-red-500 text-center py-8">Erro ao carregar escritórios</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="text-red-500 text-center py-8">Erro de conexão</p>';
    }
}

// View functions for clients
function viewClient(id) {
    openClientModal(id);
}

function editClient(id) {
    openClientModal(id);
}
async function deleteClient(id) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        try {
            const response = await fetch(`${API_URL}/api/v1/clients/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (response.ok) {
                loadClients();
            } else {
                alert('Erro ao excluir cliente');
            }
        } catch (error) {
            alert('Erro de conexão');
        }
    }
}

let currentProcessId = null;

function viewProcess(id) {
    openProcessDetailsModal(id);
}

function editProcess(id) {
    openProcessModal(id);
}

// Process Details Modal Functions
async function openProcessDetailsModal(processId) {
    currentProcessId = processId;

    try {
        // Fetch process details
        const response = await fetch(`${API_URL}/api/v1/processes/${processId}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const process = await response.json();

            // Update modal content
            document.getElementById('processDetailsNumber').textContent = process.process_number || '';
            document.getElementById('processDetailsSubject').textContent = process.subject || 'Sem assunto';
            document.getElementById('processDetailsCourt').textContent = process.court_name || (process.court_type ? process.court_type.toUpperCase() : 'N/A');

            // Update status badge
            const statusBadge = document.getElementById('processDetailsStatus');
            statusBadge.textContent = process.status || 'N/A';
            const statusClasses = {
                'active': 'bg-green-100 text-green-800',
                'suspended': 'bg-yellow-100 text-yellow-800',
                'archived': 'bg-gray-100 text-gray-800',
                'finished': 'bg-blue-100 text-blue-800'
            };
            statusBadge.className = `inline-block px-2 py-1 text-xs font-semibold rounded ${statusClasses[process.status] || 'bg-gray-100 text-gray-800'}`;

            // Show modal
            document.getElementById('processDetailsModal').classList.remove('hidden');

            // Load movements
            loadProcessMovements(processId);
        } else {
            alert('Erro ao carregar detalhes do processo');
        }
    } catch (error) {
        console.error('Error loading process details:', error);
        alert('Erro de conexão ao carregar processo');
    }
}

function closeProcessDetailsModal() {
    document.getElementById('processDetailsModal').classList.add('hidden');
    currentProcessId = null;
}

async function loadProcessMovements(processId) {
    const container = document.getElementById('processMovementsList');
    container.innerHTML = '<p class="text-gray-500 text-center py-8">Carregando...</p>';

    try {
        const response = await fetch(`${API_URL}/api/v1/processes/${processId}/movements`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();

            // Update last sync info
            if (data.last_sync) {
                const syncDate = new Date(data.last_sync);
                document.getElementById('processDetailsLastSync').textContent = syncDate.toLocaleString('pt-BR');
            } else {
                document.getElementById('processDetailsLastSync').textContent = 'Nunca';
            }

            if (data.movements && data.movements.length > 0) {
                container.innerHTML = data.movements.map(movement => {
                    const movDate = movement.movement_date ? new Date(movement.movement_date).toLocaleString('pt-BR') : 'Data não disponível';
                    return `
                        <div class="border-l-4 border-indigo-500 bg-white p-4 rounded-lg shadow-sm">
                            <div class="flex justify-between items-start mb-2">
                                <h5 class="font-semibold text-gray-800">${movement.movement_name || 'Movimentação'}</h5>
                                <span class="text-xs text-gray-500">${movDate}</span>
                            </div>
                            ${movement.movement_code ? `<p class="text-xs text-gray-500 mb-1">Código: ${movement.movement_code}</p>` : ''}
                            ${movement.description ? `<p class="text-sm text-gray-700">${movement.description}</p>` : ''}
                        </div>
                    `;
                }).join('');
            } else {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-inbox text-4xl text-gray-300 mb-2"></i>
                        <p class="text-gray-500">Nenhuma movimentação encontrada</p>
                        <p class="text-sm text-gray-400 mt-1">Clique em "Sincronizar" para buscar andamentos</p>
                    </div>
                `;
            }
        } else {
            container.innerHTML = '<p class="text-red-500 text-center py-8">Erro ao carregar andamentos</p>';
        }
    } catch (error) {
        console.error('Error loading movements:', error);
        container.innerHTML = '<p class="text-red-500 text-center py-8">Erro de conexão</p>';
    }
}

async function syncProcessDetails() {
    if (!currentProcessId) return;

    const btn = document.getElementById('syncProcessBtn');
    const originalHtml = btn.innerHTML;

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sincronizando...';

        const response = await fetch(`${API_URL}/api/v1/processes/${currentProcessId}/sync`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const result = await response.json();
            alert(`Sincronização concluída!\n${result.movements_found || 0} movimentações encontradas\n${result.new_movements || 0} novas movimentações salvas`);
            loadProcessMovements(currentProcessId);
        } else {
            const error = await response.json();
            alert(`Erro ao sincronizar: ${error.detail || 'Erro desconhecido'}`);
        }
    } catch (error) {
        console.error('Error syncing process:', error);
        alert('Erro de conexão ao sincronizar processo');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}
async function deleteProcess(id) {
    if (confirm('Tem certeza que deseja excluir este processo?')) {
        try {
            const response = await fetch(`${API_URL}/api/v1/processes/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (response.ok) {
                loadProcesses();
            } else {
                alert('Erro ao excluir processo');
            }
        } catch (error) {
            alert('Erro de conexão');
        }
    }
}

async function syncProcess(id) {
    if (confirm('Sincronizar este processo com o DataJud CNJ?')) {
        try {
            const response = await fetch(`${API_URL}/api/v1/processes/${id}/sync`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const result = await response.json();
                alert(`Processo sincronizado! ${result.movements_found || 0} movimentações encontradas.`);
                loadProcesses();
            } else {
                alert('Erro ao sincronizar processo');
            }
        } catch (error) {
            alert('Erro de conexão');
        }
    }
}

function viewLawyer(id) {
    openLawyerModal(id);
}

function editLawyer(id) {
    openLawyerModal(id);
}
async function deleteLawyer(id) {
    if (confirm('Tem certeza que deseja excluir este advogado?')) {
        try {
            const response = await fetch(`${API_URL}/api/v1/lawyers/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (response.ok) {
                loadLawyers();
            } else {
                alert('Erro ao excluir advogado');
            }
        } catch (error) {
            alert('Erro de conexão');
        }
    }
}

function viewFirm(id) {
    openFirmModal(id);
}

function editFirm(id) {
    openFirmModal(id);
}
async function deleteFirm(id) {
    if (confirm('Tem certeza que deseja excluir este escritório?')) {
        try {
            const response = await fetch(`${API_URL}/api/v1/law-firms/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (response.ok) {
                loadFirms();
            } else {
                alert('Erro ao excluir escritório');
            }
        } catch (error) {
            alert('Erro de conexão');
        }
    }
}

// Mobile menu toggle
document.getElementById('mobile-menu-btn').addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('-translate-x-full');
});

// Initialize
if (checkAuth()) {
    loadCurrentUser();
    loadDashboardStats();
}
