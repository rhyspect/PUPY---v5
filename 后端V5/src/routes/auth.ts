import Express from 'express';
import type { BootstrapOnboardingRequest, LoginRequest, RegisterRequest } from '../types/index.js';
import { AuthRequest, authMiddleware } from '../middleware/authMiddleware.js';
import AuthService from '../services/authService.js';
import PetService from '../services/petService.js';
import { validateEmail, validatePassword, validateUsername } from '../utils/validators.js';

const router = Express.Router();

router.post('/register', async (req: Express.Request, res: Express.Response) => {
  try {
    const { username, email, password, age, gender, resident_city } = req.body as RegisterRequest;

    if (!username || !email || !password || !age || !gender || !resident_city) {
      return res.status(400).json({ success: false, error: '\u7f3a\u5c11\u5fc5\u586b\u53c2\u6570\u3002', code: 400 });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, error: '\u8bf7\u8f93\u5165\u6709\u6548\u7684\u90ae\u7bb1\u5730\u5740\u3002', code: 400 });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ success: false, error: '\u5bc6\u7801\u957f\u5ea6\u81f3\u5c11\u9700\u8981 6 \u4f4d\u3002', code: 400 });
    }

    if (!validateUsername(username)) {
      return res.status(400).json({ success: false, error: '\u7528\u6237\u540d\u957f\u5ea6\u9700\u5728 2 \u5230 30 \u4e2a\u5b57\u7b26\u4e4b\u95f4\u3002', code: 400 });
    }

    const result = await AuthService.register({
      username,
      email,
      password,
      age,
      gender,
      resident_city,
    });

    res.status(result.success ? 201 : (result.code || 400)).json(result);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: '\u6ce8\u518c\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002', code: 500 });
  }
});

router.post('/login', async (req: Express.Request, res: Express.Response) => {
  try {
    const { email, password } = req.body as LoginRequest;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: '\u8bf7\u8f93\u5165\u90ae\u7bb1\u548c\u5bc6\u7801\u3002', code: 400 });
    }

    const result = await AuthService.login({ email, password });
    res.status(result.success ? 200 : (result.code || 401)).json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: '\u767b\u5f55\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002', code: 500 });
  }
});

router.post('/bootstrap', async (req: Express.Request, res: Express.Response) => {
  try {
    const { owner, pet, auth } = req.body as BootstrapOnboardingRequest;
    const email = auth.email;
    const usernameSeed = auth.username?.trim();
    const fallbackUsername = email?.split('@')[0]?.trim() || owner.name || 'pupy-user';
    const username = !usernameSeed || usernameSeed === '\u0050\u0055\u0050\u0059 \u63a2\u7d22\u8005' ? fallbackUsername : usernameSeed;
    const password = auth.password;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: '\u5efa\u6863\u524d\u9700\u8981\u5148\u63d0\u4f9b\u90ae\u7bb1\u548c\u5bc6\u7801\u3002', code: 400 });
    }

    const registerResult = await AuthService.register({
      username,
      email,
      password,
      age: owner.age || 18,
      gender: owner.gender || 'other',
      resident_city: owner.residentCity || 'Shanghai',
    });

    if (!registerResult.success || !registerResult.data?.user || !registerResult.data.token) {
      return res.status(registerResult.code || 400).json(registerResult);
    }

    const user = registerResult.data.user;
    const userId = user.id;

    const updateResult = await AuthService.updateUser(userId, {
      username,
      age: owner.age,
      gender: owner.gender,
      resident_city: owner.residentCity,
      frequent_cities: owner.frequentCities || [],
      hobbies: owner.hobbies || [],
      mbti: owner.mbti,
      signature: owner.signature,
      avatar_url: owner.photos?.[0] || owner.avatar,
      bio: owner.signature,
    });

    if (!updateResult.success) {
      return res.status(updateResult.code || 400).json(updateResult);
    }

    const petResult = await PetService.createPet(userId, {
      name: pet.name || '\u65b0\u670b\u53cb',
      type: pet.type || '\u5ba0\u7269\u4f19\u4f34',
      gender: pet.gender || '\u672a\u77e5',
      personality: pet.personality || '\u53cb\u597d\u4eb2\u4eba',
      breed: pet.type || '\u5ba0\u7269\u4f19\u4f34',
      age: null,
      weight: null,
      images: pet.images || [],
      bio: `${pet.name || '\u65b0\u670b\u53cb'} \u5df2\u5b8c\u6210\u5efa\u6863\uff0c\u51c6\u5907\u5f00\u59cb\u65b0\u7684\u793e\u4ea4\u65c5\u7a0b\u3002`,
    });

    if (!petResult.success || !petResult.data) {
      return res.status(petResult.code || 400).json(petResult);
    }

    res.status(201).json({
      success: true,
      data: {
        user: updateResult.data || user,
        pet: petResult.data,
        token: registerResult.data.token,
      },
      message: '\u6ce8\u518c\u4e0e\u5efa\u6863\u5df2\u5b8c\u6210\u3002',
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    res.status(500).json({ success: false, error: '\u5efa\u6863\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002', code: 500 });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: '\u672a\u6388\u6743\u8bbf\u95ee\u3002', code: 401 });
    }

    const user = await AuthService.getUserById(req.user.user_id);
    if (!user) {
      return res.status(404).json({ success: false, error: '\u7528\u6237\u4e0d\u5b58\u5728\u3002', code: 404 });
    }

    res.json({
      success: true,
      data: AuthService.toSafeUser(user),
      message: '\u5f53\u524d\u7528\u6237\u4fe1\u606f\u5df2\u540c\u6b65\u3002',
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, error: '\u83b7\u53d6\u5f53\u524d\u7528\u6237\u5931\u8d25\u3002', code: 500 });
  }
});

router.put('/me', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: '\u672a\u6388\u6743\u8bbf\u95ee\u3002', code: 401 });
    }

    const result = await AuthService.updateUser(req.user.user_id, req.body);
    res.status(result.success ? 200 : (result.code || 400)).json(result);
  } catch (error) {
    console.error('Update current user error:', error);
    res.status(500).json({ success: false, error: '\u66f4\u65b0\u7528\u6237\u4fe1\u606f\u5931\u8d25\u3002', code: 500 });
  }
});

export default router;
