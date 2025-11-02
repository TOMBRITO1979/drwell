import { Router } from 'express';
import authRoutes from './auth.routes';
import clientRoutes from './client.routes';
import caseRoutes from './case.routes';
import casePartRoutes from './case-part.routes';
import companyRoutes from './company.routes';
import userRoutes from './user.routes';
import financialRoutes from './financial.routes';
import documentRoutes from './document.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/cases', caseRoutes);
router.use('/cases', casePartRoutes); // Rotas de partes do processo (/cases/:caseId/parts)
router.use('/companies', companyRoutes);
router.use('/users', userRoutes);
router.use('/financial', financialRoutes);
router.use('/documents', documentRoutes);

export default router;
