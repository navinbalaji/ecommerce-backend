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

        let {
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

        const customerCart = await Cart.findOne({
            customer_id: Types.ObjectId.createFromHexString(customer_id),
        })
            .session(session)
            .exec();

        const notEligibleProducts = [];

        const eligibleProductsForOrder = products.filter((cartProduct) => {
            const sizedProduct = allProducts
                ?.find(
                    (p) =>
                        p?._id?.toString() ===
                        cartProduct?.product_id?.toString()
                )
                ?.variants.find((v) => v?.color === cartProduct?.color)
                ?.sizes?.find((e) => e?.size === cartProduct?.size);

            const isEligible =
                sizedProduct &&
                sizedProduct.inventory_quantity > 0 &&
                sizedProduct.inventory_quantity >=
                    (cartProduct ? cartProduct.quantity : 0);

            if (!isEligible) {
                const [cartProductTemp] = customerCart.products.filter(
                    (e) => e.product_id?.toString() === cartProduct?.product_id?.toString()
                );
                if(cartProductTemp){
                    products = products.map((e) => {
                        if (e.product_id.toString() === cartProduct?.product_id?.toString()) {
                            return {
                                ...e,
                                quantity: cartProductTemp.quantity,
                            };
                        }
                        return e;
                    });
                }
        
                notEligibleProducts.push(
                    `The requested quantity for the product (${cartProduct.product_name}) is out-of-stock`
                );
            }

            return isEligible;
        });

        if (notEligibleProducts.length > 0) {
            req.body['products']=products
            return res.status(200).json(
                successResponse('Cart created successfully', {
                    cartData: req.body,
                    notEligibleProducts,
                })
            );
        }

        const cartUpdateData = {
            email: customer.email,
            customer_id: customer._id,
            products: eligibleProductsForOrder,
            delivery_address: is_default_address
                ? customer.address
                : new_delivery_address,
        };

        if (
            !cartUpdateData.delivery_address ||
            !cartUpdateData.delivery_address.line1 ||
            !cartUpdateData.delivery_address.city ||
            !cartUpdateData.delivery_address.state ||
            !cartUpdateData.delivery_address.country ||
            !cartUpdateData.delivery_address.pincode
        ) {
            throw new Error('Please add the address');
        }

        let cartData;

        if (customerCart) {
            customerCart.products = eligibleProductsForOrder;
            customerCart.delivery_address = cartUpdateData.delivery_address;
            cartData = await customerCart.save({ session });
        } else {
            [cartData] = await Cart.create([cartUpdateData], { session });
        }

        await session.commitTransaction();
        return res.status(200).json(
            successResponse('Cart created successfully', {
                cartData,
            })
        );
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
