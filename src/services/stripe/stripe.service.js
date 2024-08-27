'use strict';

import mongoose, { Types } from 'mongoose';
import Stripe from 'stripe';

// schema
import Product from '#schema/product.schema.js';
import Order from '#schema/order.schema.js';
import Analytics from '#schema/analytics.schema.js';
import BestSelling from '#schema/best-selling.schema.js';
import InventoryReduce from '#schema/inventory-reduce.schema.js';

// utils
import { successResponse, failureResponse } from '#common';

/**
 * Handles a POST request to handle stripe payment
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const handleWebhook = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2024-06-20',
        });

        const event = stripe.webhooks.constructEvent(
            req.body,
            req.headers['stripe-signature'],
            process.env.STRIPE_WEBHOOK_SECRET
        );

        const paymentIntent = event?.data?.object;

        // Access the metadata
        const { orderId, customerId, orderNumber } = paymentIntent?.metadata;

        const inventoryDoc = await InventoryReduce.findOne(
            {
                order_id: orderId,
                order_number: orderNumber,
            },
            { session }
        );

        const order = await Order.findOne({
            order_id: Types.ObjectId.createFromHexString(orderId),
        }).exec();

        if (!order) {
            inventoryDoc.is_webhook_delivered = true;
            inventoryDoc.stripe = event;

            inventoryDoc.save({ session });
            return;
        }

        // Handle the event
        if (event.type !== 'payment_intent.succeeded') {
            inventoryDoc.is_webhook_delivered = true;
            inventoryDoc.stripe = event;
            inventoryDoc.save({ session });
            await session.commitTransaction();
            return res.status(200).json(successResponse('Payment Failed'));
        }

        const productIds =
            inventoryDoc?.inventory_products
                ?.map((e) => e.product_id)
                ?.filter(Boolean) || [];

        await Promise.all(
            inventoryDoc?.inventory_products.map((e) =>
                reduceInventoryQuantity(e.product_id, e.color, e.size)
            )
        );

        // Update Analytics
        await Analytics.findOneAndUpdate(
            { name: 'dashboard' },
            {
                $inc: {
                    total_order_amount: inventoryDoc.order_amount,
                    total_orders: 1,
                },
            },
            { upsert: true, session }
        );

        // Update BestSelling
        await BestSelling.updateMany(
            {
                product_id: {
                    $in: productIds,
                },
            },
            { $inc: { quantity: 1 } },
            { upsert: true, session }
        );

        // inventory update
        inventoryDoc.is_webhook_delivered = false;
        inventoryDoc.stripe = event;

        // payment completed
        order.is_payment_completed = true;

        await inventoryDoc.save({ session });

        await order.save({ session });

        await session.commitTransaction();

        return res.status(200).json(successResponse('Payment successfull'));
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
const reduceInventoryQuantity = async (productId, color, size) => {
    return Product.findOneAndUpdate(
        {
            _id: productId,
            'variants.color': color,
            'variants.sizes': {
                $elemMatch: { size: size, inventory_quantity: { $gt: 0 } },
            },
        },
        {
            $inc: { 'variants.$[v].sizes.$[s].inventory_quantity': -1 },
        },
        {
            new: true,
            session: session,
            arrayFilters: [{ 'v.color': color }, { 's.size': size }],
        }
    ).exec();
};
