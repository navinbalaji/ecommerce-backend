'use strict';

import { Router } from 'express';

// services
import {
    createProduct,
    getProduct,
    updateProduct,
    getAllProducts,
    deleteProduct,
    getNewProducts,
    getBestSellingProducts
} from '#services/product/product.service.js';

// validators
import { productCreateSchema } from '#src/validators/product.validator.js';

// utils
import { validate } from '#common';
import { ROLES } from '#constants';
import roleMiddleware from '#middleware/roleMiddleware.js';

const productRouter = new Router();

productRouter.get('/all', getAllProducts);

productRouter.get('/new', getNewProducts);

productRouter.get('/best-selling', getBestSellingProducts);

productRouter.get('/:id', getProduct);

productRouter.post('/', roleMiddleware(ROLES.ADMIN),validate(productCreateSchema), createProduct);

productRouter.put('/:id',roleMiddleware(ROLES.ADMIN), validate(productCreateSchema), updateProduct);

productRouter.delete('/:id', roleMiddleware(ROLES.ADMIN),deleteProduct);

export default productRouter;
