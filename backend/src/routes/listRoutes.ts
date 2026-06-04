import { Router } from 'express';
import { getAllLists, getListById, createList, updateList } from '../controllers/listController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas de listas
router.use(authMiddleware);

router.get('/', getAllLists);
router.get('/:id', getListById);
router.post('/', createList);
router.put('/:id', updateList);

export default router;
