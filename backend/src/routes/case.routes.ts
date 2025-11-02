import { Router } from 'express';
import caseController from '../controllers/case.controller';
import { authenticate } from '../middleware/auth';
import { validateTenant } from '../middleware/tenant';

const router = Router();

router.use(authenticate);
router.use(validateTenant);

router.post('/', caseController.create);
router.get('/', caseController.list);
router.get('/:id', caseController.get);
router.put('/:id', caseController.update);
router.post('/:id/sync', caseController.syncMovements);

export default router;
