'use strict';

import { Router } from 'express';

// services
import { getMeta, updateMeta } from '#services/meta/meta.service.js';

// validators
import { metaUpdate } from '#src/validators/meta.validator.js';

// utils
import { validate } from '#common';
import { ROLES } from '#constants';

import tokenExpirationMiddleware from '#middleware/jwtToken.js';
import roleMiddleware from '#middleware/roleMiddleware.js';

const metaRouter = new Router();

metaRouter.get('/',getMeta);

metaRouter.put(
    '/',
    tokenExpirationMiddleware,
    roleMiddleware(ROLES.ADMIN),
    validate(metaUpdate),
    updateMeta
);

export default metaRouter;
