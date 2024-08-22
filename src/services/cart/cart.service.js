'use strict';

import mongoose from 'mongoose';

// schema
import Customer from '#schema/customer.schema.js';
import Product from '#schema/product.schema.js';
import Cart from '#schema/cart.schema.js';

// utils
import { successResponse, failureResponse } from '#common';

/**
 * Handles a POST request to create a new order.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const createCart = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const { email, is_default_address, new_delivery_address, products } = req.body;

        if (!email) {
            return res.status(400).json(failureResponse('Email ID required'));
        }

        const customer = await Customer.findOne({ email }).session(session);
        if (!customer) {
            return res.status(404).json(failureResponse('Customer not found'));
        }

        const productIds = products.map(e => e.product_id).filter(Boolean);
        const availableProducts = await Product.find({ _id: { $in: productIds } }).session(session).exec();

        const eligibleProductsForOrder = availableProducts.filter(cartProduct => {
            const sizedProduct = cartProduct.variants.sizes.find(e => e.size === cartProduct.size);
            const customerCartProduct = products.find(e => e.product_id === cartProduct._id.toString());
            return sizedProduct && 
                   sizedProduct.inventory_quantity > 0 && 
                   sizedProduct.inventory_quantity >= (customerCartProduct ? customerCartProduct.quantity : 0);
        });

        const cartUpdateData = {
            email,
            customer_id: customer._id,
            products: eligibleProductsForOrder,
            delivery_address: is_default_address ? customer.address : new_delivery_address,
        };

        let cartData;
        const customerCart = await Cart.findOne({ email }).session(session).exec();
        if (customerCart) {
            customerCart.products = eligibleProductsForOrder;
            cartData = await customerCart.save({ session });
        } else {
            cartData = await Cart.create(cartUpdateData, { session });
        }

        await session.commitTransaction();
        return res.status(200).json(successResponse('Cart created successfully', { cartData }));
    } catch (err) {
        if (session.inTransaction) {
            await session.abortTransaction();
        }
        return res.status(500).json(failureResponse(err.message || 'Something went wrong'));
    } finally {
        session.endSession();
    }
};
