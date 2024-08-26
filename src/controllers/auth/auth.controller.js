'use strict';

import { Router } from 'express';

// services
import { login, register,verifyCustomer,resendVerificationToken } from '#services/auth/auth.service.js';

// validators
import { loginSchema,registerSchema,verificationTokenSchema,resendVerificationTokenSchema } from '#src/validators/customer.validator.js';

// utils
import { validate } from '#common';

const authRouter = new Router();

authRouter.post('/login', validate(loginSchema), login);

authRouter.post('/register', validate(registerSchema),register);

authRouter.post('/verify',  validate(verificationTokenSchema), verifyCustomer);

authRouter.post('/resend-verification',  validate(resendVerificationTokenSchema), resendVerificationToken);

export default authRouter;
