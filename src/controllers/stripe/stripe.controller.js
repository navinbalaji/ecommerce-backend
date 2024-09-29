'use strict';

import { Router, raw } from 'express';

// services
import { handleWebhook } from '#services/stripe/stripe.service.js';

const stripeRouter = new Router();

stripeRouter.post('/webhook', raw({ type: 'application/json' }), handleWebhook);

export default stripeRouter;
