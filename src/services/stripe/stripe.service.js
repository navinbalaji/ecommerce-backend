'use strict';

import mongoose, { Types } from 'mongoose';
import Stripe from 'stripe';

// schema
import Product from '#schema/product.schema.js';
import Order from '#schema/order.schema.js';
import Analytics from '#schema/analytics.schema.js';
import BestSelling from '#schema/best-selling.schema.js';
import InventoryReduce from '#schema/inventory-reduce.schema.js';

// service
import { generateOrderSuccessEmail } from '../order/order.service.js';

// utils
import { successResponse, failureResponse } from '#common';

/**
 * Handles a POST request to handle Stripe payment
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */
export const handleWebhook = async (req, res) => {
    console.log("******** stripe webhook called ******** ");
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: process.env.STRIPE_API_VERSION,
        });

        const event = stripe.webhooks.constructEvent(
            req.body,
            req.headers['stripe-signature'],
            process.env.STRIPE_WEBHOOK_SECRET
        );

        const paymentIntent = event?.data?.object;

        // Access the metadata
        const { orderId, customerId, orderNumber } = paymentIntent?.metadata;

        if(!orderId || !customerId || !orderNumber){
            return res.status(200).json({orderId, customerId ,orderNumber})
        }

        const inventoryDoc = await InventoryReduce.findOne(
            {
                order_id: orderId,
                order_number: orderNumber,
            }
        ).session(session); // Pass session here

        const order = await Order.findById(orderId).session(session); // Pass session here

        if (!order) {
            inventoryDoc.is_webhook_delivered = true;
            inventoryDoc.stripe = event;

            await inventoryDoc.save({ session });
            return;
        }
        // Handle the event
        if (event.type !== 'payment_intent.succeeded') {
            inventoryDoc.is_webhook_delivered = true;
            inventoryDoc.stripe = event;
            await inventoryDoc.save({ session });
            await session.commitTransaction();
            return res.status(200).json(successResponse('Payment Failed'));
        }

        const productIds = inventoryDoc?.inventory_products
            ?.map((e) => e.product_id)
            ?.filter(Boolean) || [];

        // Reduce inventory for each product
        for (const e of inventoryDoc?.inventory_products) {
            await reduceInventoryQuantity(e.product_id, e.color, e.size, session);
        }

        // Update Analytics
        await Analytics.findOneAndUpdate(
            { name: 'dashboard' },
            {
                $inc: {
                    total_order_amount: inventoryDoc.order_amount,
                    total_orders: 1,
                },
            },
            { upsert: true, session } // Pass session here
        );

        // Update BestSelling
        await BestSelling.updateMany(
            {
                product_id: {
                    $in: productIds,
                },
            },
            { $inc: { quantity: 1 } },
            { upsert: true, session } // Pass session here
        );

        // Update inventory document
        inventoryDoc.is_webhook_delivered = false;
        inventoryDoc.stripe = event;

        // Mark payment as completed in the order
        order.is_payment_completed = true;

        await inventoryDoc.save({ session });
        const orderDoc = await order.save({ session });

        // Generate order success email
        await generateOrderSuccessEmail(orderDoc);

        // Commit the transaction
        await session.commitTransaction();

        return res.status(200).json(successResponse('Payment successful'));
    } catch (err) {
        console.log("stripe webhook",err);
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        return res
            .status(400)
            .json(failureResponse(err?.message || 'Something went wrong'));
    } finally {
        session.endSession();
    }
};

// Helper function to reduce inventory quantity
const reduceInventoryQuantity = async (productId, color, size, session) => {
    await Product.findOneAndUpdate(
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
            session: session, // Pass session to ensure atomic operations
            arrayFilters: [{ 'v.color': color }, { 's.size': size }],
        }
    );
};
