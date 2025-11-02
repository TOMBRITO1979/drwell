import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateTenant } from '../middleware/tenant';
import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  searchDocuments,
} from '../controllers/document.controller';

const router = Router();

// Aplicar autenticação e validação de tenant em todas as rotas
router.use(authenticate, validateTenant);

// Rotas de documentos
router.get('/', listDocuments);                    // Listar documentos com filtros
router.get('/search', searchDocuments);            // Buscar por cliente ou processo
router.get('/:id', getDocument);                   // Buscar documento por ID
router.post('/', createDocument);                  // Criar novo documento
router.put('/:id', updateDocument);                // Atualizar documento
router.delete('/:id', deleteDocument);             // Excluir documento

export default router;
