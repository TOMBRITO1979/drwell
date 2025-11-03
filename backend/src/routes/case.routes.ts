import { Router } from 'express';
import caseController from '../controllers/case.controller';
import { authenticate } from '../middleware/auth';
import { validateTenant } from '../middleware/tenant';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);
router.use(validateTenant);

router.post('/', caseController.create);
router.get('/', caseController.list);
router.get('/export/csv', caseController.exportCSV);
router.post('/import/csv', upload.single('file'), caseController.importCSV);
router.get('/:id', caseController.get);
router.put('/:id', caseController.update);
router.post('/:id/sync', caseController.syncMovements);

export default router;
