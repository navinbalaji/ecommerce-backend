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

/**
 * Handles a GET request to get all products.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const getAllProducts = async (req, res) => {
    try {
        const { start, after, offset, total } = req.query;

        const query = {};
        if (start) {
            query._id = { $gt: start };
        } else if (after) {
            query._id = { $lt: after };
        }

        const [products] = await Product.aggregate([
            {
                $facet: {
                    data: [
                        { $match: query },
                        { $sort: { _id: -1 } }, // sort by _id in descending order (newest first)
                        { $skip: offset }, // skip the specified number of documents
                        { $limit: total } // limit the number of documents returned
                    ],
                    totalCount: [
                        { $match: query },
                        { $count: 'total' } // count the total number of documents
                    ]
                }
            },
            {
                $project: {
                    data: 1,
                    totalCount: { $arrayElemAt: ['$totalCount.total', 0] } // extract the total count from the array
                }
            }
        ]);

        const { data, totalCount } = products; // extract the data and total count

        return res
            .status(200)
            .json(successResponse({ products: data, totalCount }));
    } catch (err) {
        return res
            .status(400)
            .json(failureResponse(err?.message || 'something went wrong'));
    }
};



export const getProduct = (req, res) => {
    return res.send('getProducts');
};

export const updateProduct = (req, res) => {
    return res.send('updateProduct');
};
