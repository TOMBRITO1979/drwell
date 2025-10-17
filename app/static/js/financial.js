// Financial Module
let currentFinancialRecord = null;

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Load Financial Summary
async function loadFinancialSummary() {
    try {
        const response = await fetch(`${API_URL}/api/v1/financial/summary`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const summary = await response.json();
            document.getElementById('stats-total-received').textContent = formatCurrency(summary.total_received || 0);
            document.getElementById('stats-total-receivable').textContent = formatCurrency(summary.total_receivable || 0);
            document.getElementById('stats-total-expenses').textContent = formatCurrency(summary.total_expenses || 0);
            document.getElementById('stats-total-overdue').textContent = formatCurrency(summary.total_overdue || 0);
            document.getElementById('stats-expenses-pending').textContent = formatCurrency(summary.total_expenses_pending || 0);
            document.getElementById('stats-balance').textContent = formatCurrency(summary.balance || 0);
        }
    } catch (error) {
        console.error('Error loading financial summary:', error);
    }
}

// Load Financial Records
async function loadFinancialRecords(filters = {}) {
    const container = document.getElementById('financial-list');
    container.innerHTML = '<p class="text-gray-500 text-center py-8">Carregando...</p>';

    try {
        // Build query string
        const params = new URLSearchParams();
        if (filters.transaction_type) params.append('transaction_type', filters.transaction_type);
        if (filters.payment_status) params.append('payment_status', filters.payment_status);
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);

        const queryString = params.toString();
        const url = `${API_URL}/api/v1/financial/${queryString ? '?' + queryString : ''}`;

        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const records = await response.json();

            if (records.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum registro financeiro encontrado</p>';
                return;
            }

            container.innerHTML = records.map(record => {
                const typeLabels = {
                    'receivable': 'A Receber',
                    'received': 'Recebido',
                    'expense': 'Despesa'
                };

                const statusLabels = {
                    'pending': 'Pendente',
                    'paid': 'Pago',
                    'overdue': 'Atrasado',
                    'cancelled': 'Cancelado'
                };

                const typeColors = {
                    'receivable': 'text-yellow-600',
                    'received': 'text-green-600',
                    'expense': 'text-red-600'
                };

                const statusColors = {
                    'pending': 'bg-yellow-100 text-yellow-800',
                    'paid': 'bg-green-100 text-green-800',
                    'overdue': 'bg-red-100 text-red-800',
                    'cancelled': 'bg-gray-100 text-gray-800'
                };

                return `
                    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="flex items-center mb-2">
                                    <h4 class="text-lg font-semibold text-gray-800 mr-3">${record.description}</h4>
                                    <span class="inline-block px-2 py-1 text-xs font-semibold rounded ${statusColors[record.payment_status]}">
                                        ${statusLabels[record.payment_status]}
                                    </span>
                                </div>
                                <p class="text-2xl font-bold ${typeColors[record.transaction_type]} mb-2">
                                    ${formatCurrency(record.amount)}
                                </p>
                                <div class="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                    <div>
                                        <span class="font-medium">Tipo:</span> ${typeLabels[record.transaction_type]}
                                    </div>
                                    ${record.due_date ? `
                                        <div>
                                            <span class="font-medium">Vencimento:</span> ${formatDate(record.due_date)}
                                        </div>
                                    ` : ''}
                                    ${record.payment_date ? `
                                        <div>
                                            <span class="font-medium">Pagamento:</span> ${formatDate(record.payment_date)}
                                        </div>
                                    ` : ''}
                                    ${record.payment_method ? `
                                        <div>
                                            <span class="font-medium">Método:</span> ${record.payment_method}
                                        </div>
                                    ` : ''}
                                    ${record.client_name ? `
                                        <div>
                                            <span class="font-medium">Cliente:</span> ${record.client_name}
                                        </div>
                                    ` : ''}
                                    ${record.process_number ? `
                                        <div>
                                            <span class="font-medium">Processo:</span> ${record.process_number}
                                        </div>
                                    ` : ''}
                                    ${record.invoice_number ? `
                                        <div>
                                            <span class="font-medium">NF:</span> ${record.invoice_number}
                                        </div>
                                    ` : ''}
                                </div>
                                ${record.notes ? `
                                    <p class="text-sm text-gray-600 mt-2 italic">${record.notes}</p>
                                ` : ''}
                            </div>
                            <div class="flex flex-col space-y-2 ml-4">
                                <button onclick="editFinancialRecord(${record.id})" class="text-blue-600 hover:text-blue-800" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteFinancialRecord(${record.id})" class="text-red-600 hover:text-red-800" title="Excluir">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p class="text-red-500 text-center py-8">Erro ao carregar registros financeiros</p>';
        }
    } catch (error) {
        console.error('Error loading financial records:', error);
        container.innerHTML = '<p class="text-red-500 text-center py-8">Erro de conexão</p>';
    }
}

// Open Financial Modal
async function openFinancialModal(type = 'receivable', recordId = null) {
    currentFinancialRecord = recordId;

    const modal = document.getElementById('financialModal');
    const form = document.getElementById('financialForm');
    const title = document.getElementById('financialModalTitle');
    const submitBtn = document.getElementById('financialSubmitBtn');

    // Reset form
    form.reset();
    document.getElementById('financialRecordId').value = '';

    // Load clients and processes for selects
    await loadFinancialSelects();

    if (recordId) {
        // Edit mode
        title.textContent = 'Editar Registro Financeiro';
        submitBtn.textContent = 'Atualizar';

        try {
            const response = await fetch(`${API_URL}/api/v1/financial/${recordId}`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const record = await response.json();

                // Fill form
                document.getElementById('financialRecordId').value = record.id;
                form.querySelector('[name="transaction_type"]').value = record.transaction_type;
                form.querySelector('[name="description"]').value = record.description;
                form.querySelector('[name="amount"]').value = record.amount;
                form.querySelector('[name="payment_status"]').value = record.payment_status;
                form.querySelector('[name="due_date"]').value = record.due_date || '';
                form.querySelector('[name="payment_date"]').value = record.payment_date || '';
                form.querySelector('[name="payment_method"]').value = record.payment_method || '';
                form.querySelector('[name="invoice_number"]').value = record.invoice_number || '';
                form.querySelector('[name="client_id"]').value = record.client_id || '';
                form.querySelector('[name="process_id"]').value = record.process_id || '';
                form.querySelector('[name="notes"]').value = record.notes || '';
            }
        } catch (error) {
            console.error('Error loading financial record:', error);
            alert('Erro ao carregar registro financeiro');
            return;
        }
    } else {
        // Create mode
        title.textContent = type === 'expense' ? 'Nova Despesa' : 'Nova Receita';
        submitBtn.textContent = 'Criar';
        form.querySelector('[name="transaction_type"]').value = type;
    }

    modal.classList.remove('hidden');
}

// Close Financial Modal
function closeFinancialModal() {
    document.getElementById('financialModal').classList.add('hidden');
    currentFinancialRecord = null;
}

// Load clients and processes for selects
async function loadFinancialSelects() {
    try {
        // Load clients
        const clientsRes = await fetch(`${API_URL}/api/v1/clients/`, {
            headers: getAuthHeaders()
        });
        if (clientsRes.ok) {
            const clients = await clientsRes.json();
            const clientSelect = document.getElementById('financialClientSelect');
            clientSelect.innerHTML = '<option value="">Nenhum</option>' +
                clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }

        // Load processes
        const processesRes = await fetch(`${API_URL}/api/v1/processes/`, {
            headers: getAuthHeaders()
        });
        if (processesRes.ok) {
            const processes = await processesRes.json();
            const processSelect = document.getElementById('financialProcessSelect');
            processSelect.innerHTML = '<option value="">Nenhum</option>' +
                processes.map(p => `<option value="${p.id}">${p.process_number} - ${p.subject}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading selects:', error);
    }
}

// Handle form submission
document.getElementById('financialForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        transaction_type: formData.get('transaction_type'),
        description: formData.get('description'),
        amount: parseFloat(formData.get('amount')),
        payment_status: formData.get('payment_status'),
        due_date: formData.get('due_date') || null,
        payment_date: formData.get('payment_date') || null,
        payment_method: formData.get('payment_method') || null,
        invoice_number: formData.get('invoice_number') || null,
        client_id: formData.get('client_id') ? parseInt(formData.get('client_id')) : null,
        process_id: formData.get('process_id') ? parseInt(formData.get('process_id')) : null,
        notes: formData.get('notes') || null
    };

    const recordId = document.getElementById('financialRecordId').value;

    try {
        const url = recordId
            ? `${API_URL}/api/v1/financial/${recordId}`
            : `${API_URL}/api/v1/financial/`;

        const method = recordId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert(recordId ? 'Registro atualizado com sucesso!' : 'Registro criado com sucesso!');
            closeFinancialModal();
            loadFinancialSummary();
            loadFinancialRecords();
        } else {
            const error = await response.json();
            alert('Erro: ' + (error.detail || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Error saving financial record:', error);
        alert('Erro de conexão');
    }
});

// Edit Financial Record
function editFinancialRecord(id) {
    openFinancialModal('receivable', id);
}

// Delete Financial Record
async function deleteFinancialRecord(id) {
    if (confirm('Tem certeza que deseja excluir este registro financeiro?')) {
        try {
            const response = await fetch(`${API_URL}/api/v1/financial/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                alert('Registro excluído com sucesso!');
                loadFinancialSummary();
                loadFinancialRecords();
            } else {
                alert('Erro ao excluir registro');
            }
        } catch (error) {
            console.error('Error deleting financial record:', error);
            alert('Erro de conexão');
        }
    }
}

// Apply Filters
function applyFinancialFilters() {
    const filters = {
        transaction_type: document.getElementById('filter-transaction-type').value,
        payment_status: document.getElementById('filter-payment-status').value,
        start_date: document.getElementById('filter-start-date').value,
        end_date: document.getElementById('filter-end-date').value
    };

    loadFinancialRecords(filters);
}

// Clear Filters
function clearFinancialFilters() {
    document.getElementById('filter-transaction-type').value = '';
    document.getElementById('filter-payment-status').value = '';
    document.getElementById('filter-start-date').value = '';
    document.getElementById('filter-end-date').value = '';

    loadFinancialRecords();
}
