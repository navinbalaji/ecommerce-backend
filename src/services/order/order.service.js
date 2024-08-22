'use strict';

import mongoose from 'mongoose';

// schema
import Order from '#schema/order.schema.js';
import Product from '#schema/product.schema.js';
import Cart from '#schema/cart.schema.js';
import Analytics from '#schema/analytics.schema.js';

// utils
import { successResponse, failureResponse, generateOrderNumber } from '#common';

/**
 * Handles a POST request to create a new order.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const createOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { email } = req.body;

        if (!email) {
            throw new Error('Email ID required');
        }

        const customerCart = await Cart.findOne({ email })
            .session(session)
            .exec();
        if (!customerCart || customerCart.products.length === 0) {
            throw new Error(customerCart ? 'Cart is empty' : 'Cart not found');
        }

        const productIds = customerCart.products
            .map((e) => e.product_id)
            .filter(Boolean);
        const products = await Product.find({ _id: { $in: productIds } })
            .session(session)
            .exec();

        let order_amount = 0;
        const inventoryUpdates = [];

        for (const cart_product of customerCart.products) {
            const product = products.find(
                (e) => e._id.toString() === cart_product.product_id.toString()
            );
            const sized_product = product?.variants.sizes.find(
                (e) => e.size === cart_product.size
            );

            if (
                !sized_product ||
                sized_product.inventory_quantity === 0 ||
                sized_product.inventory_quantity < cart_product.quantity
            ) {
                throw new Error(
                    `${product.title} of size ${cart_product.size} is out of stock`
                );
            }

            order_amount += cart_product.quantity * sized_product.price;
            inventoryUpdates.push(
                reduceInventoryQuantity(
                    product._id,
                    sized_product.size,
                    session
                )
            );
        }

        // Wait for all inventory updates to complete
        await Promise.all(inventoryUpdates);

        const order_number = generateOrderNumber();
        await Order.create(
            [
                {
                    order_number,
                    order_amount,
                    customer_id: customerCart.customer_id,
                    cart: customerCart,
                    is_delivered: false,
                    is_cancelled: false,
                    is_fullfilled: true,
                    delivery_address: customerCart.delivery_address,
                },
            ],
            { session }
        );

        // remove the cart
        await Cart.deleteOne({ email }, { session });

        // TODO: Send order email

        await Analytics.findOneAndUpdate(
            { name: 'dashboard' },
            { $inc: { total_order_amount: order_amount, total_orders: 1 } },
            { upsert: true, session }
        );

        await session.commitTransaction();
        return res
            .status(200)
            .json(successResponse('Order created successfully'));
    } catch (err) {
        if (session.inTransaction) {
            await session.abortTransaction();
        }
        return res
            .status(400)
            .json(failureResponse(err.message || 'Something went wrong'));
    } finally {
        session.endSession();
    }
};

const reduceInventoryQuantity = async (productId, size, session) => {
    return Product.findOneAndUpdate(
        {
            _id: productId,
            'variants.sizes.size': size,
            'variants.sizes.inventory_quantity': { $gt: 0 },
        },
        {
            $inc: { 'variants.sizes.$.inventory_quantity': -1 },
        },
        {
            new: true,
            session: session,
        }
    ).exec();
};

/**
 * Handles a GET request to get all orders.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const getAllOrders = async (req, res) => {
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

        const [orders] = await Order.aggregate(pipeline);

        const { data, totalCount } = orders; // extract the data and total count

        return res.status(200).json(
            successResponse('Orders fetched successfully', {
                orders: data,
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
 * Handles a GET request to get a order.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const getOrderByOrderId = async (req, res) => {
    try {
        const { order_id } = req.params;

        if (!id) {
            throw new Error('Order Id is missing');
        }
        const order = await Order.findOne({ order_id }).lean().exec();

        if (!order) {
            return res.status(404).json(failureResponse('Order not found'));
        }

        return res
            .status(200)
            .json(successResponse('Order fetched successfully', { product }));
    } catch (err) {
        return res
            .status(400)
            .json(failureResponse(err?.message || 'something went wrong'));
    }
};

/**
 * Handles a PUT request to update a order.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const orderData = req.body;

        if (!id) {
            throw new Error('Order Id is missing');
        }
        const order = await Order.findByIdAndUpdate(id, {
            ...orderData,
        }).exec();

        if (!order) {
            throw new Error('Order update failed');
        }

        return res
            .status(200)
            .json(successResponse('Order updated successfully'));
    } catch (err) {
        return res
            .status(400)
            .json(failureResponse(err?.message || 'something went wrong'));
    }
};
