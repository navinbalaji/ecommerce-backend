'use strict';

import { Router } from 'express';

// services
import {
    createProduct,
    getProducts,
    updateProduct,
} from '#services/product/product.service.js';

// validators
import { productCreateSchema } from '#src/validators/product.validator.js';

// utils
import { validate } from '#common';

const productRouter = new Router();

productRouter.get('/', getProducts);

productRouter.post('/', validate(productCreateSchema), createProduct);

productRouter.put('/', updateProduct);

export default productRouter;
