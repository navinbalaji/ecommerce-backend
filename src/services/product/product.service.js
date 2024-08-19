// schema
import Product from '#schema/product.schema.js';

// utils
import { successResponse, failureResponse } from '#common';

/**
 * Handles a POST request to create a new product.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const createProduct = async (req, res) => {
    try {
        await Product.create({
            ...req.body,
        });

        return res
            .status(200)
            .json(successResponse('Product Created successfully'));
    } catch (err) {
        return res
            .status(400)
            .json(failureResponse(err?.message || 'something went wrong'));
    }
};

export const getProducts = (req, res) => {
    return res.send('getProducts');
};

export const updateProduct = (req, res) => {
    return res.send('updateProduct');
};
