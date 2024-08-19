import { Router } from 'express';

// services
import { login, register } from '#services/auth/auth.service.js';

// validators
import { loginSchema } from '#src/validators/login.validator.js';

// utils
import { validate } from '#common';

const authRouter = Router();

authRouter.post('/login', validate(loginSchema), login);

authRouter.post('/register', register);

export default authRouter;
