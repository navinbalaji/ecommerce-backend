'use strict';

import { Router } from 'express';

// services
import {
    getAllImages,
    insertImage,
    deleteImage,
} from '#services/image/image.service.js';

// validators
import { imageInsertSchema } from '#src/validators/image.validator.js';

// utils
import { validate } from '#common';
import { ROLES } from '#constants';

import roleMiddleware from '#middleware/roleMiddleware.js';

const imageRouter = new Router();

imageRouter.get('/',roleMiddleware(ROLES.ADMIN),getAllImages);
imageRouter.post('/',validate(imageInsertSchema),insertImage);
imageRouter.delete('/:id',roleMiddleware(ROLES.ADMIN), deleteImage);

export default imageRouter;
