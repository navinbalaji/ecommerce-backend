'use strict';

import { Router } from 'express';

// services
import { handleWebhook } from '#services/stripe/stripe.service.js';

const stripeRouter = new Router();

stripeRouter.post('/webhook', handleWebhook);

export default stripeRouter;
