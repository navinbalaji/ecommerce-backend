'use strict';

import { Router } from 'express';

// services
import {
    getAllCustomers,
    getCustomer,
    updateCustomer,
    searchCustomer
} from '#services/customer/customer.service.js';

// validators
import { customerUpdateSchema } from '#src/validators/customer.validator.js';

// utils
import { validate } from '#common';

const customerRouter = new Router();

customerRouter.get('/all', getAllCustomers);

customerRouter.get('/search', searchCustomer);

customerRouter.get('/:id', getCustomer);

customerRouter.put('/:id', validate(customerUpdateSchema), updateCustomer);

export default customerRouter;
