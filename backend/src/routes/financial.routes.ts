import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateTenant } from '../middleware/tenant';
import {
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getFinancialSummary,
  exportPDF,
  exportCSV,
} from '../controllers/financial.controller';

const router = Router();

// Aplicar autenticação e validação de tenant em todas as rotas
router.use(authenticate, validateTenant);

// Rotas de transações financeiras
router.get('/', listTransactions);                    // Listar transações com filtros
router.get('/summary', getFinancialSummary);          // Resumo financeiro
router.get('/export/pdf', exportPDF);                 // Exportar para PDF
router.get('/export/csv', exportCSV);                 // Exportar para CSV
router.get('/:id', getTransaction);                   // Buscar transação por ID
router.post('/', createTransaction);                  // Criar nova transação
router.put('/:id', updateTransaction);                // Atualizar transação
router.delete('/:id', deleteTransaction);             // Excluir transação

export default router;
