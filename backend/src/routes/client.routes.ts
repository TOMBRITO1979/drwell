import { Router } from 'express';
import clientController from '../controllers/client.controller';
import { authenticate } from '../middleware/auth';
import { validateTenant } from '../middleware/tenant';

const router = Router();

router.use(authenticate);
router.use(validateTenant);

router.post('/', clientController.create);
router.get('/', clientController.list);
router.get('/:id', clientController.get);
router.put('/:id', clientController.update);
router.delete('/:id', clientController.delete);

export default router;
