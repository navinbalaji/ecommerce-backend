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

const productRouter = new Router();

productRouter.get('/all', getAllProducts);

productRouter.get('/new', getNewProducts);

productRouter.get('/best-selling', getBestSellingProducts);

productRouter.get('/:id', getProduct);

productRouter.post('/', validate(productCreateSchema), createProduct);

productRouter.put('/:id', validate(productCreateSchema), updateProduct);

productRouter.delete('/:id', deleteProduct);

export default productRouter;
