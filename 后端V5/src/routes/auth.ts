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
      return res.status(400).json({ success: false, error: 'Missing required fields.', code: 400 });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format.', code: 400 });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.', code: 400 });
    }

    if (!validateUsername(username)) {
      return res.status(400).json({ success: false, error: 'Username must be between 2 and 30 characters.', code: 400 });
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
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.post('/login', async (req: Express.Request, res: Express.Response) => {
  try {
    const { email, password } = req.body as LoginRequest;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.', code: 400 });
    }

    const result = await AuthService.login({ email, password });
    res.status(result.success ? 200 : (result.code || 401)).json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.post('/bootstrap', async (req: Express.Request, res: Express.Response) => {
  try {
    const { owner, pet, auth } = req.body as BootstrapOnboardingRequest;
    const username = auth.username || owner.name || 'pupy-user';
    const email = auth.email;
    const password = auth.password;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required for bootstrap.', code: 400 });
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
      name: pet.name || 'Pet Friend',
      type: pet.type || 'Pet Companion',
      gender: pet.gender || 'unknown',
      personality: pet.personality || 'balanced',
      breed: pet.type || 'Pet Companion',
      age: null,
      weight: null,
      images: pet.images || [],
      bio: `${pet.name || 'Pet Friend'} joined via onboarding.`,
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
      message: 'Bootstrap onboarding succeeded.',
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const user = await AuthService.getUserById(req.user.user_id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.', code: 404 });
    }

    res.json({
      success: true,
      data: AuthService.toSafeUser(user),
      message: 'Current user loaded.',
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

router.put('/me', authMiddleware, async (req: AuthRequest, res: Express.Response) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ success: false, error: 'Unauthorized.', code: 401 });
    }

    const result = await AuthService.updateUser(req.user.user_id, req.body);
    res.status(result.success ? 200 : (result.code || 400)).json(result);
  } catch (error) {
    console.error('Update current user error:', error);
    res.status(500).json({ success: false, error: 'Server error.', code: 500 });
  }
});

export default router;
