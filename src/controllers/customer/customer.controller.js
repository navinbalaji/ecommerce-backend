'use strict';

import { Router } from 'express';

// services
import {
    getAllCustomers,
    getCustomerById,
    getCustomer,
    updateCustomer,
    searchCustomer,
} from '#services/customer/customer.service.js';

// validators
import { customerUpdateSchema } from '#src/validators/customer.validator.js';

// utils
import { validate } from '#common';
import { ROLES } from '#constants';
import roleMiddleware from '#middleware/roleMiddleware.js';

const customerRouter = new Router();

customerRouter.get('/all', roleMiddleware(ROLES.ADMIN), getAllCustomers);

customerRouter.get('/search',roleMiddleware(ROLES.ADMIN), searchCustomer);

customerRouter.get('/:id', roleMiddleware(ROLES.ADMIN) ,getCustomerById);

customerRouter.get('/', getCustomer);

customerRouter.put('/:id', validate(customerUpdateSchema), updateCustomer);

export default customerRouter;
