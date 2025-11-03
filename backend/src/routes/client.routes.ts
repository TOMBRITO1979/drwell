import { Router } from 'express';
import clientController from '../controllers/client.controller';
import { authenticate } from '../middleware/auth';
import { validateTenant } from '../middleware/tenant';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);
router.use(validateTenant);

router.post('/', clientController.create);
router.get('/', clientController.list);
router.get('/export/csv', clientController.exportCSV);
router.post('/import/csv', upload.single('file'), clientController.importCSV);
router.get('/:id', clientController.get);
router.put('/:id', clientController.update);
router.delete('/:id', clientController.delete);

export default router;
