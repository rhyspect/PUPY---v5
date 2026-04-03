import Express from 'express';
import type { CreatePetRequest } from '../types/index.js';
import { AuthRequest, authMiddleware } from '../middleware/authMiddleware.js';
import PetService from '../services/petService.js';

const router = Express.Router();

router.post('/', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const petData = req.body as CreatePetRequest;
    const result = await PetService.createPet(req.user.user_id, petData);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('Create pet error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const result = await PetService.getPetsByUserId(req.user.user_id);
    res.json(result);
  } catch (error) {
    console.error('Get pets error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.get('/discover', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const { type, gender, limit = '20' } = req.query;
    const result = await PetService.getDiscoveryFeed(
      req.user.user_id,
      typeof type === 'string' ? type : undefined,
      typeof gender === 'string' ? gender : undefined,
      Number(limit),
    );

    res.json(result);
  } catch (error) {
    console.error('Get discovery feed error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.get('/:petId', async (req: Express.Request, res: Express.Response) => {
  try {
    const pet = await PetService.getPetById(req.params.petId);
    if (!pet) {
      return res.status(404).json({ success: false, error: 'Pet not found.', code: 404 });
    }

    res.json({ success: true, data: pet, message: 'Pet loaded.' });
  } catch (error) {
    console.error('Get pet error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.put('/:petId', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const result = await PetService.updatePet(req.user.user_id, req.params.petId, req.body);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Update pet error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.delete('/:petId', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const result = await PetService.deletePet(req.user.user_id, req.params.petId);
    res.json(result);
  } catch (error) {
    console.error('Delete pet error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.post('/:petId/digital-twin', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const { modelUrl, aiPersonality } = req.body;
    const result = await PetService.createDigitalTwin(
      req.user.user_id,
      req.params.petId,
      modelUrl,
      aiPersonality,
    );
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Create digital twin error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.get('/breeding/available', async (req: Express.Request, res: Express.Response) => {
  try {
    const { type, gender, limit = '20', offset = '0' } = req.query;
    if (!type || !gender) {
      return res.status(400).json({ success: false, error: 'Missing required parameters.', code: 400 });
    }

    const result = await PetService.getBreedingPets(
      type as string,
      gender as string,
      Number(limit),
      Number(offset),
    );
    res.json(result);
  } catch (error) {
    console.error('Get breeding pets error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

export default router;
