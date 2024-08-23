'use strict';

import mongoose from 'mongoose';

// schema
import Product from '#schema/product.schema.js';
import Analytics from '#schema/analytics.schema.js';

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
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const productData = req.body;

        await Product.create([productData], { session });

        // Update analytics
        await Analytics.findOneAndUpdate(
            { name: 'dashboard' },
            { $inc: { total_products: 1 } },
            { upsert: true, session }
        );

        await session.commitTransaction();

        return res
            .status(200)
            .json(successResponse('Product Created successfully'));
    } catch (err) {
        if (session.inTransaction) {
            await session.abortTransaction();
        }
        return res
            .status(400)
            .json(failureResponse(err?.message || 'something went wrong'));
    } finally {
        session.endSession();
    }
};

/**
 * Handles a GET request to get all products.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const getAllProducts = async (req, res) => {
    try {
        const { offset, limit } = req.query;

        const pipeline = [
            {
                $facet: {
                    data: [
                        { $skip: Number(offset) || 0 },
                        { $limit: Number(limit) || 10 }, // default limit to 10 if not provided
                        { $sort: { _id: 1 } },
                    ],
                    totalCount: [
                        { $count: 'total' }, // count the total number of documents
                    ],
                },
            },
            {
                $project: {
                    data: 1,
                    totalCount: { $arrayElemAt: ['$totalCount.total', 0] }, // extract the total count from the array
                },
            },
        ];

        const [products] = await Product.aggregate(pipeline);

        const { data, totalCount } = products; // extract the data and total count

        return res.status(200).json(
            successResponse('Products fetched successfully', {
                products: data,
                totalCount,
            })
        );
    } catch (err) {
        return res
            .status(400)
            .json(failureResponse(err?.message || 'something went wrong'));
    }
};

/**
 * Handles a GET request to get a product.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const getProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            throw new Error('Product Id is missing');
        }
        const product = await Product.findById(id).lean().exec();

        if (!product) {
            return res.status(404).json(failureResponse('Product not found'));
        }

        return res
            .status(200)
            .json(successResponse('Product fetched successfully', { product }));
    } catch (err) {
        return res
            .status(400)
            .json(failureResponse(err?.message || 'something went wrong'));
    }
};

/**
 * Handles a PUT request to update a product.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productData = req.body;

        if (!id) {
            throw new Error('Product Id is missing');
        }
        const product = await Product.findByIdAndUpdate(id, {
            ...productData,
        }).exec();

        if (!product) {
            throw new Error('Product update failed');
        }

        return res
            .status(200)
            .json(successResponse('Product updated successfully'));
    } catch (err) {
        return res
            .status(400)
            .json(failureResponse(err?.message || 'something went wrong'));
    }
};

/**
 * Handles a DELETE request to delete a product.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const deleteProduct = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { id } = req.params;

        if (!id) {
            throw new Error('Product Id is missing');
        }
        const product = await Product.findByIdAndDelete(id).exec();

        if (!product) {
            throw new Error('Product delete failed');
        }

        // Update analytics
        await Analytics.findOneAndUpdate(
            { name: 'dashboard' },
            { $inc: { total_products: -1 } },
            { upsert: true, session }
        );

        await session.commitTransaction();

        return res
            .status(200)
            .json(successResponse('Product deleted successfully'));
    } catch (err) {
        if (session.inTransaction) {
            await session.abortTransaction();
        }
        return res
            .status(400)
            .json(failureResponse(err?.message || 'something went wrong'));
    }
};

/**
 * Handles a GET request to return a new product.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const getNewProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 }).limit(6).lean().exec()
        if (!products?.length) {
            throw new Error('No Products are available');
        }
        return res
            .status(200)
            .json(successResponse('New Product Fetched successfully',{products}));
    } catch (err) {
        return res
            .status(400)
            .json(failureResponse(err?.message || 'something went wrong'));
    }
};

/**
 * Handles a GET request to return Best Selling Products.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const getBestSellingProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 }).limit(6).lean().exec()
        if (!products?.length) {
            throw new Error('No Products are available');
        }
        return res
            .status(200)
            .json(successResponse('New Product Fetched successfully',{products}));
    } catch (err) {
        return res
            .status(400)
            .json(failureResponse(err?.message || 'something went wrong'));
    }
};
