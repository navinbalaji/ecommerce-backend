'use strict';

import { Router } from 'express';

// services
import {createAndUpdateCart,getCart} from '#services/cart/cart.service.js';

// validators
import { cartCreateValidator } from '#src/validators/cart.validator.js';

// utils
import { validate } from '#common';

const cartRouter = new Router();

cartRouter.get('/:id', getCart);

cartRouter.post('/',validate(cartCreateValidator), createAndUpdateCart);

cartRouter.put('/',validate(cartCreateValidator), createAndUpdateCart);

export default cartRouter;
