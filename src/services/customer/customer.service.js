'use strict';

// schema
import Customer from '#schema/customer.schema.js';

// utils
import { successResponse, failureResponse } from '#common';

/**
 * Handles a GET request to get all customers.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const getAllCustomers = async (req, res) => {
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

        const [customers] = await Customer.aggregate(pipeline);

        const { data, totalCount } = customers; // extract the data and total count

        return res.status(200).json(
            successResponse('Customers fetched successfully', {
                customers: data,
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
 * Handles a GET request to get a customers.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const getCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            throw new Error('Customer Id is missing');
        }
        const customer = await Customer.findById(id).lean().exec();

        if (!customer) {
            return res.status(404).json(failureResponse('Customer not found'));
        }

        return res
            .status(200)
            .json(
                successResponse('Customer fetched successfully', { customer })
            );
    } catch (err) {
        return res
            .status(400)
            .json(failureResponse(err?.message || 'something went wrong'));
    }
};

/**
 * Handles a PUT request to update a customer.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const customerData = req.body;

        if (!id) {
            throw new Error('Customer Id is missing');
        }
        const customer = await Customer.findByIdAndUpdate(id, {
            ...customerData,
        }).exec();

        if (!customer) {
            throw new Error('Customer update failed');
        }

        return res
            .status(200)
            .json(successResponse('Customer updated successfully'));
    } catch (err) {
        return res
            .status(400)
            .json(failureResponse(err?.message || 'something went wrong'));
    }
};

/**
 * Handles a GET request to search a customer.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const searchCustomer = async (req, res) => {
    try {
        const { name, phone_number, email } = req.query;

        if (!name && !phone_number && !email) {
            throw new Error(
                'At least one of name, phone number, or email is required'
            );
        }

        const query = {};

        if (name) {
            query['name'] = { $regex: `.*${name}.*`, $options: 'i' };
        }
        if (phone_number) {
            const formattedPhoneNumber = phone_number.replace(/[^0-9]/g, '');
            query['phone_number'] = {
                $regex: `.*${formattedPhoneNumber}.*`,
                $options: 'i',
            };
        }
        if (email) {
            query['email'] = { $regex: `.*${email}.*`, $options: 'i' };
        }

        const customer = await Customer.findOne(query).exec();

        if (!customer) {
            return res.status(404).json(failureResponse('Customer not found'));
        }

        return res
            .status(200)
            .json(successResponse('Customer found successfully', customer));
    } catch (err) {
        return res
            .status(400)
            .json(failureResponse(err?.message || 'Something went wrong'));
    }
};
