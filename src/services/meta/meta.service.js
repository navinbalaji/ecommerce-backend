'use strict';

// schema
import Meta from '#schema/meta.schema.js';

// utils
import { successResponse, failureResponse } from '#common';
import { metaTransform } from '#transformers/meta.transformer.js';

/**
 * Handles a GET request to get meta data.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const getMeta = async (_, res) => {
    try {
        const meta = await Meta.findOne({ shop: 'prajGeos' }).lean().exec();

        if (!meta) {
            return res.status(404).json(failureResponse('Meta not found'));
        }

        return res
            .status(200)
            .json(successResponse('Meta fetched successfully', { meta }));
    } catch (err) {
        return res
            .status(400)
            .json(failureResponse(err?.message || 'something went wrong'));
    }
};

/**
 * Handles a PUT request to update meta.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const updateMeta = async (req, res) => {
    try {
        const metaData = req.body;

        const metaDoc = await Meta.findOneAndUpdate(
            { shop: 'prajGeos' },
            {
                ...metaData,
            },
            { new: true, upsert: true }
        ).exec();

        return res
            .status(200)
            .json(successResponse('Meta updated successfully',metaTransform(metaDoc)));
    } catch (err) {
        return res
            .status(400)
            .json(failureResponse(err?.message || 'something went wrong'));
    }
};
