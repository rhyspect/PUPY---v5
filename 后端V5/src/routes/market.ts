import Express from 'express';
import { AuthRequest, authMiddleware } from '../middleware/authMiddleware.js';
import MarketService from '../services/marketService.js';
import { getPaginationParams } from '../utils/pagination.js';

const router = Express.Router();

router.get('/feed', async (req: Express.Request, res: Express.Response) => {
  try {
    const { category, type, limit = '20' } = req.query;
    const result = await MarketService.getFeed(
      typeof category === 'string' ? category : undefined,
      typeof type === 'string' ? type : undefined,
      Number(limit),
    );

    res.json(result);
  } catch (error) {
    console.error('Get market feed error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: '未认证', code: 401 });
    }

    const { title, description, category, price, images, type, requirements, pet_id } = req.body;
    if (!title || !description || !category || !type || !images) {
      return res.status(400).json({ success: false, error: '缺少必填参数', code: 400 });
    }

    const result = await MarketService.createProduct(req.user.user_id, {
      title,
      description,
      category,
      price,
      images,
      type,
      requirements,
      pet_id,
    });

    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('Create market product error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.get('/category/:category', async (req: Express.Request, res: Express.Response) => {
  try {
    const paginationParams = getPaginationParams(req.query);
    const result = await MarketService.getProductsByCategory(
      req.params.category,
      paginationParams.page,
      paginationParams.limit,
    );

    res.json(result);
  } catch (error) {
    console.error('Get market category error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.get('/search', async (req: Express.Request, res: Express.Response) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ success: false, error: 'Missing keyword.', code: 400 });
    }

    const paginationParams = getPaginationParams(req.query);
    const result = await MarketService.searchProducts(
      keyword as string,
      paginationParams.page,
      paginationParams.limit,
    );

    res.json(result);
  } catch (error) {
    console.error('Search market error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.get('/seller/:sellerId', async (req: Express.Request, res: Express.Response) => {
  try {
    const result = await MarketService.getSellerProducts(req.params.sellerId);
    res.json(result);
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.put('/:productId', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    const result = await MarketService.updateProduct(req.params.productId, req.body);
    res.json(result);
  } catch (error) {
    console.error('Update market product error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.delete('/:productId', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    const result = await MarketService.deleteProduct(req.params.productId);
    res.json(result);
  } catch (error) {
    console.error('Delete market product error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.get('/breeding/market', async (req: Express.Request, res: Express.Response) => {
  try {
    const paginationParams = getPaginationParams(req.query);
    const result = await MarketService.getBreedingMarket(
      paginationParams.page,
      paginationParams.limit,
    );

    res.json(result);
  } catch (error) {
    console.error('Get breeding market error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

export default router;
