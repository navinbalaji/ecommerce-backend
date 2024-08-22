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

        const customerCart = await Cart.findOne({ email }).lean().session(session).exec();
        if (!customerCart || customerCart.products.length === 0) {
            throw new Error(customerCart ? 'Cart is empty' : 'Cart not found');
        }

        const productIds = customerCart.products.map(e => e.product_id).filter(Boolean);
        const products = await Product.find({ _id: { $in: productIds } }).session(session).exec();

        let order_amount = 0;
        const inventoryUpdates = [];

        for (const cart_product of customerCart.products) {
            const product = products.find(e => e._id.toString() === cart_product.product_id.toString());
            const sized_product = product?.variants.sizes.find(e => e.size === cart_product.size);

            if (!sized_product || sized_product.inventory_quantity === 0) {
                throw new Error(`${product.name} of size ${cart_product.size} is out of stock`);
            }

            order_amount += cart_product.quantity * sized_product.price;
            inventoryUpdates.push(reduceInventoryQuantity(product._id, sized_product.size, session));
        }

        // Wait for all inventory updates to complete
        await Promise.all(inventoryUpdates);

        const order_number = generateOrderNumber();
        await Order.create(
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
            { session }
        );

        // TODO: Send order email

        await Analytics.findOneAndUpdate(
            { name: 'dashboard' },
            { $inc: { total_order_amount: order_amount, total_orders: 1 } },
            { session }
        );

        await session.commitTransaction();
        return res.status(200).json(successResponse('Order created successfully'));
    } catch (err) {
        if (session.inTransaction) {
            await session.abortTransaction();
        }
        return res.status(400).json(failureResponse(err.message || 'Something went wrong'));
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
