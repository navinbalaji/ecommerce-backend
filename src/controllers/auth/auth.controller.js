'use strict';

import { Router } from 'express';

// services
import { login, register } from '#services/auth/auth.service.js';

// validators
import { loginSchema,registerSchema } from '#src/validators/customer.validator.js';

// utils
import { validate } from '#common';

const authRouter = new Router();

authRouter.post('/login', validate(loginSchema), login);

authRouter.post('/register', validate(registerSchema),register);

export default authRouter;
