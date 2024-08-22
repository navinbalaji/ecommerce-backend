'use strict';

import { Router } from 'express';

// services
import {createAndUpdateCart,getCart} from '#services/cart/cart.service.js';

// validators
import { cartCreateValidator } from '#src/validators/cart.validator.js';

// utils
import { validate } from '#common';

const orderRouter = new Router();

orderRouter.get('/', getCart);

orderRouter.post('/',validate(cartCreateValidator), createAndUpdateCart);

orderRouter.put('/',validate(cartCreateValidator), createAndUpdateCart);

export default orderRouter;
