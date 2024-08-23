'use strict';

import mongoose, { Types } from 'mongoose';

// schema
import Customer from '#schema/customer.schema.js';
import Product from '#schema/product.schema.js';
import Cart from '#schema/cart.schema.js';

// utils
import { successResponse, failureResponse } from '#common';

/**
 * Handles a POST request to create a new cart.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const createAndUpdateCart = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const {
            customer_id,
            is_default_address,
            new_delivery_address,
            products,
        } = req.body;

        if (!customer_id) {
            return res
                .status(400)
                .json(failureResponse('Customer ID required'));
        }

        const customer = await Customer.findOne({ _id: customer_id }).session(
            session
        );
        if (!customer) {
            return res.status(404).json(failureResponse('Customer not found'));
        }

        const productIds = products.map((e) => e.product_id).filter(Boolean);
        const allProducts = await Product.find({
            _id: { $in: productIds },
        })
            .session(session)
            .exec();

        const eligibleProductsForOrder = products.filter((cartProduct) => {
            const sizedProduct = allProducts
                ?.find(
                    (p) =>
                        p?._id?.toString() ===
                        cartProduct?.product_id?.toString()
                )
                ?.variants.find((v) => v?.color === cartProduct?.color)
                ?.sizes?.find((e) => e?.size === cartProduct?.size);
            return (
                sizedProduct &&
                sizedProduct.inventory_quantity > 0 &&
                sizedProduct.inventory_quantity >=
                    (cartProduct ? cartProduct.quantity : 0)
            );
        });

        const cartUpdateData = {
            email: customer.email,
            customer_id: customer._id,
            products: eligibleProductsForOrder,
            delivery_address: is_default_address
                ? customer.address
                : new_delivery_address,
        };

        if (!cartUpdateData.delivery_address) {
            throw new Error('Please add the address');
        }

        let cartData;
        const customerCart = await Cart.findOne({
            customer_id: Types.ObjectId.createFromHexString(customer_id),
        })
            .session(session)
            .exec();
        if (customerCart) {
            customerCart.products = eligibleProductsForOrder;
            cartData = await customerCart.save({ session });
        } else {
            [cartData] = await Cart.create([cartUpdateData], { session });
        }

        await session.commitTransaction();
        return res
            .status(200)
            .json(successResponse('Cart created successfully', { cartData }));
    } catch (err) {
        if (session.inTransaction) {
            await session.abortTransaction();
        }
        return res
            .status(500)
            .json(failureResponse(err.message || 'Something went wrong'));
    } finally {
        session.endSession();
    }
};

/**
 * Handles a GET request to get a cart.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const getCart = async (req, res) => {
    try {
        const id = req?.user?.cid;

        if (!id) {
            return res
                .status(400)
                .json(failureResponse('Customer Id is required'));
        }

        let cart = await Cart.findOne({ customer_id: new Types.ObjectId(id) })
            .lean()
            .exec();

        if (!cart) {
            const customer = await Customer.findById(id).lean().exec();

            if (customer) {
                cart = await Cart.create({
                    email: customer.email,
                    customer_id: customer._id,
                    products: [],
                    delivery_address: {},
                });
            } else {
                return res
                    .status(404)
                    .json(failureResponse('Customer not found'));
            }
        }

        return res
            .status(200)
            .json(successResponse('Cart fetched successfully', { cart }));
    } catch (err) {
        return res
            .status(500)
            .json(failureResponse(err?.message || 'Something went wrong'));
    }
};
