'use strict';

import { Router } from 'express';

// services
import {
    createOrder,
    getAllOrders,
    getOrderByOrderId,
    updateOrder,
    getCustomerOrders
} from '#services/order/order.service.js';

// validators
import { orderCreate,orderUpdate } from '#src/validators/order.validator.js';

// utils
import { validate } from '#common';
import { ROLES } from '#constants';
import roleMiddleware from '#middleware/roleMiddleware.js';

const orderRouter = new Router();

orderRouter.get('/all',roleMiddleware(ROLES.ADMIN), getAllOrders);

orderRouter.get('/customer/:id', getCustomerOrders);

orderRouter.get('/:id', getOrderByOrderId);

orderRouter.post('/',validate(orderCreate), createOrder);

orderRouter.put('/:id',roleMiddleware(ROLES.ADMIN), validate(orderUpdate), updateOrder);

export default orderRouter;
