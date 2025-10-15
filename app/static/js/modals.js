// Modal utility functions
function showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// === CLIENT MODAL FUNCTIONS ===
function openClientModal(clientId = null) {
    const form = document.getElementById('clientForm');
    form.reset();

    if (clientId) {
        loadClientForEdit(clientId);
    }

    showModal('clientModal');
}

function closeClientModal() {
    hideModal('clientModal');
}

async function loadClientForEdit(clientId) {
    try {
        const response = await fetch(`${API_URL}/api/v1/clients/${clientId}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const client = await response.json();
            const form = document.getElementById('clientForm');
            form.elements['name'].value = client.full_name || '';
            form.elements['email'].value = client.email || '';
            form.elements['phone'].value = client.phone || '';
            form.elements['cpf_cnpj'].value = client.cpf_cnpj || '';
            form.elements['address'].value = client.address || '';
            form.dataset.clientId = client.id;
        }
    } catch (error) {
        alert('Erro ao carregar cliente');
    }
}

// Client form submission
document.addEventListener('DOMContentLoaded', function() {
    const clientForm = document.getElementById('clientForm');
    if (clientForm) {
        clientForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const clientId = this.dataset.clientId;
            const data = {
                name: this.elements['name'].value,
                email: this.elements['email'].value,
                phone: this.elements['phone'].value,
                cpf_cnpj: this.elements['cpf_cnpj'].value,
                address: this.elements['address'].value
            };

            try {
                const url = clientId
                    ? `${API_URL}/api/v1/clients/${clientId}`
                    : `${API_URL}/api/v1/clients/`;

                const method = clientId ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method: method,
                    headers: getAuthHeaders(),
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    closeClientModal();
                    loadClients();
                    alert(clientId ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!');
                    delete this.dataset.clientId;
                } else {
                    const error = await response.json();
                    console.error('Erro ao salvar cliente:', error);
                    alert('Erro: ' + (error.detail || JSON.stringify(error.detail || error) || 'Não foi possível salvar o cliente'));
                }
            } catch (error) {
                console.error('Erro de conexão ao salvar cliente:', error);
                alert('Erro de conexão ao salvar cliente: ' + error.message);
            }
        });
    }
});

// === PROCESS MODAL FUNCTIONS ===
function openProcessModal(processId = null) {
    const form = document.getElementById('processForm');
    form.reset();
    loadClientsForSelect();

    if (processId) {
        loadProcessForEdit(processId);
    }

    showModal('processModal');
}

function closeProcessModal() {
    hideModal('processModal');
}

async function loadClientsForSelect() {
    try {
        const response = await fetch(`${API_URL}/api/v1/clients/`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const clients = await response.json();
            const select = document.getElementById('processClientSelect');
            select.innerHTML = '<option value="">Selecione um cliente</option>';
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.full_name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

async function loadProcessForEdit(processId) {
    try {
        const response = await fetch(`${API_URL}/api/v1/processes/${processId}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const process = await response.json();
            const form = document.getElementById('processForm');
            form.elements['process_number'].value = process.process_number || '';
            form.elements['subject'].value = process.subject || '';
            form.elements['court_type'].value = process.court_type || '';
            form.elements['status'].value = process.status || 'active';
            form.elements['client_id'].value = process.client_id || '';
            form.dataset.processId = process.id;
        }
    } catch (error) {
        alert('Erro ao carregar processo');
    }
}

// Process form submission
document.addEventListener('DOMContentLoaded', function() {
    const processForm = document.getElementById('processForm');
    if (processForm) {
        processForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const processId = this.dataset.processId;
            const data = {
                process_number: this.elements['process_number'].value,
                subject: this.elements['subject'].value,
                court_type: this.elements['court_type'].value,
                status: this.elements['status'].value,
                client_id: parseInt(this.elements['client_id'].value) || null
            };

            try {
                const url = processId
                    ? `${API_URL}/api/v1/processes/${processId}`
                    : `${API_URL}/api/v1/processes/`;

                const method = processId ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method: method,
                    headers: getAuthHeaders(),
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    closeProcessModal();
                    loadProcesses();
                    alert(processId ? 'Processo atualizado com sucesso!' : 'Processo criado com sucesso!');
                    delete this.dataset.processId;
                } else {
                    const error = await response.json();
                    alert('Erro: ' + (error.detail || 'Não foi possível salvar o processo'));
                }
            } catch (error) {
                alert('Erro de conexão ao salvar processo');
            }
        });
    }
});

// === LAWYER MODAL FUNCTIONS ===
function openLawyerModal(lawyerId = null) {
    const form = document.getElementById('lawyerForm');
    form.reset();

    if (lawyerId) {
        loadLawyerForEdit(lawyerId);
    }

    showModal('lawyerModal');
}

function closeLawyerModal() {
    hideModal('lawyerModal');
}

async function loadLawyerForEdit(lawyerId) {
    try {
        const response = await fetch(`${API_URL}/api/v1/lawyers/${lawyerId}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const lawyer = await response.json();
            const form = document.getElementById('lawyerForm');
            form.elements['full_name'].value = lawyer.full_name || '';
            form.elements['email'].value = lawyer.email || '';
            form.elements['phone'].value = lawyer.phone || '';
            form.elements['cpf'].value = lawyer.cpf || '';
            form.elements['oab_number'].value = lawyer.oab_number || '';
            form.dataset.lawyerId = lawyer.id;
        }
    } catch (error) {
        alert('Erro ao carregar advogado');
    }
}

// Lawyer form submission
document.addEventListener('DOMContentLoaded', function() {
    const lawyerForm = document.getElementById('lawyerForm');
    if (lawyerForm) {
        lawyerForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const lawyerId = this.dataset.lawyerId;
            const data = {
                full_name: this.elements['full_name'].value,
                email: this.elements['email'].value,
                phone: this.elements['phone'].value,
                cpf: this.elements['cpf'].value,
                oab_number: this.elements['oab_number'].value
            };

            try {
                const url = lawyerId
                    ? `${API_URL}/api/v1/lawyers/${lawyerId}`
                    : `${API_URL}/api/v1/lawyers/`;

                const method = lawyerId ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method: method,
                    headers: getAuthHeaders(),
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    closeLawyerModal();
                    loadLawyers();
                    alert(lawyerId ? 'Advogado atualizado com sucesso!' : 'Advogado criado com sucesso!');
                    delete this.dataset.lawyerId;
                } else {
                    const error = await response.json();
                    alert('Erro: ' + (error.detail || 'Não foi possível salvar o advogado'));
                }
            } catch (error) {
                alert('Erro de conexão ao salvar advogado');
            }
        });
    }
});

// === FIRM MODAL FUNCTIONS ===
function openFirmModal(firmId = null) {
    const form = document.getElementById('firmForm');
    form.reset();

    if (firmId) {
        loadFirmForEdit(firmId);
    }

    showModal('firmModal');
}

function closeFirmModal() {
    hideModal('firmModal');
}

async function loadFirmForEdit(firmId) {
    try {
        const response = await fetch(`${API_URL}/api/v1/law-firms/${firmId}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const firm = await response.json();
            const form = document.getElementById('firmForm');
            form.elements['name'].value = firm.name || '';
            form.elements['email'].value = firm.email || '';
            form.elements['phone'].value = firm.phone || '';
            form.elements['cnpj'].value = firm.cnpj || '';
            form.elements['address'].value = firm.address || '';
            form.dataset.firmId = firm.id;
        }
    } catch (error) {
        alert('Erro ao carregar escritório');
    }
}

// Firm form submission
document.addEventListener('DOMContentLoaded', function() {
    const firmForm = document.getElementById('firmForm');
    if (firmForm) {
        firmForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const firmId = this.dataset.firmId;
            const data = {
                name: this.elements['name'].value,
                email: this.elements['email'].value,
                phone: this.elements['phone'].value,
                cnpj: this.elements['cnpj'].value,
                address: this.elements['address'].value
            };

            try {
                const url = firmId
                    ? `${API_URL}/api/v1/law-firms/${firmId}`
                    : `${API_URL}/api/v1/law-firms/`;

                const method = firmId ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method: method,
                    headers: getAuthHeaders(),
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    closeFirmModal();
                    loadFirms();
                    alert(firmId ? 'Escritório atualizado com sucesso!' : 'Escritório criado com sucesso!');
                    delete this.dataset.firmId;
                } else {
                    const error = await response.json();
                    alert('Erro: ' + (error.detail || 'Não foi possível salvar o escritório'));
                }
            } catch (error) {
                alert('Erro de conexão ao salvar escritório');
            }
        });
    }
});
