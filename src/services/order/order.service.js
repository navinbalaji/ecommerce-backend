'use strict';

import mongoose, { Types } from 'mongoose';
import Stripe from 'stripe';

// schema
import Order from '#schema/order.schema.js';
import Product from '#schema/product.schema.js';
import Cart from '#schema/cart.schema.js';
import InventoryReduce from '#schema/inventory-reduce.schema.js';

// utils
import {
    successResponse,
    failureResponse,
    generateOrderNumber,
    sendEmail,
} from '#common';

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
        const customer_id = req?.user?.cid;

        if (!customer_id) {
            throw new Error('Customer ID required');
        }

        const customerCart = await Cart.findOne({
            customer_id: Types.ObjectId.createFromHexString(customer_id),
        })
            .session(session)
            .exec();

        if (!customerCart || customerCart.products.length === 0) {
            throw new Error('Cart is empty');
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
            const sized_product = product?.variants
                ?.find((v) => v?.color === cart_product?.color)
                ?.sizes?.find((e) => e.size === cart_product.size);

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
            inventoryUpdates.push({
                product_id: product._id,
                color: cart_product?.color,
                size: sized_product.size,
            });
        }

        const order_number = generateOrderNumber()();

        const [order] = await Order.create(
            [
                {
                    order_id: order_number,
                    order_amount,
                    customer_id: customerCart.customer_id,
                    cart: customerCart,
                    is_delivered: false,
                    is_cancelled: false,
                    is_fullfilled: true,
                    is_payment_completed: false,
                    delivery_address: customerCart.delivery_address,
                },
            ],
            { session }
        );

        const stripe_client_secret = await generatePayment(
            order_amount,
            customerCart.email,
            order._id.toString(),
            order_number,
            order_number,
            customerCart.customer_id
        );

        await InventoryReduce.findOneAndUpdate(
            { order_id: order._id, order_number: order_number },
            {
                order_id: order._id,
                order_number: order_number,
                inventory_products: inventoryUpdates,
                customer_id,
                order_amount,
                is_webhook_delivered: false,
            },
            { upsert: true, session }
        );

        // Remove the cart
        await Cart.deleteOne(
            {
                customer_id: Types.ObjectId.createFromHexString(customer_id),
            },
            { session }
        );

        await session.commitTransaction();

        return res.status(200).json(
            successResponse('Order created successfully', {
                stripe_client_secret,
                order_id: order._id,
                order_number,
            })
        );
    } catch (err) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        return res
            .status(400)
            .json(failureResponse(err.message || 'Something went wrong'));
    } finally {
        session.endSession();
    }
};

const generatePayment = async (
    amount,
    email,
    orderId,
    orderNumber,
    customerId
) => {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('Payment Failed CODE 1');
        }
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2024-06-20',
        });

        const formattedAmount = Math.round(amount * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: formattedAmount,
            currency: 'INR',
            automatic_payment_methods: {
                enabled: true,
            },
            receipt_email: email,
            metadata: {
                orderId,
                customerId,
                orderNumber,
            },
        });

        return paymentIntent?.client_secret;
    } catch (err) {
        throw err;
    }
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
        const { id } = req.params;

        if (!id) {
            throw new Error('Order Id is missing');
        }
        const order = await Order.findOne({ order_id: id }).lean().exec();

        if (!order) {
            return res.status(404).json(failureResponse('Order not found'));
        }

        return res
            .status(200)
            .json(successResponse('Order fetched successfully', { order }));
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

/**
 * Handles a GET request to get all customer orders.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const getCustomerOrders = async (req, res) => {
    try {
        const { offset, limit } = req.query;

        const id = req?.user?.cid;

        if (!id) {
            throw new Error('Customer Id is missing');
        }

        const pipeline = [
            {
                $facet: {
                    data: [
                        {
                            $match: {
                                customer_id:
                                    Types.ObjectId.createFromHexString(id),
                            },
                        },
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
            successResponse('Customer Orders fetched successfully', {
                customer_orders: data,
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
 * Generate and send the order success email to customers
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const generateOrderSuccessEmail = async (order) => {
    try {
        const { order_id, order_amount, customer_id, cart } = order;
        const customerEmail = cart.email;
        const customerName = customer_id.name || 'Customer';
        const deliveryAddress = cart.delivery_address;
        const products = cart.products;

        const subject = `Your Order #${order_id} Has Been Successfully Placed!
`;

        // Build the products list HTML
        const productListHtml = products
            .map(
                (product) => `
        <tr>
          <td>${product.product_name}</td>
          <td>${product.size}</td>
          <td>${product.color}</td>
          <td>${product.quantity}</td>
          <td>${product.price}</td>
        </tr>`
            )
            .join('');

        // Email template
        const emailHtml = `
      <h2>Order Success!</h2>
      <p>Dear ${customerName},</p>
      <p>Thank you for your purchase. Your order has been successfully placed with the following details:</p>

      <h3>Order Details:</h3>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>Total Amount:</strong> $${order_amount}</p>

      <h3>Delivery Address:</h3>
      <p>${deliveryAddress.line1}, ${
            deliveryAddress.line2 ? deliveryAddress.line2 + ', ' : ''
        }${deliveryAddress.city}, ${deliveryAddress.state}, ${
            deliveryAddress.country
        } - ${deliveryAddress.pincode}</p>

      <h3>Products:</h3>
      <table border="1" cellspacing="0" cellpadding="10">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Size</th>
            <th>Color</th>
            <th>Quantity</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          ${productListHtml}
        </tbody>
      </table>

      <p>We hope you enjoy your purchase. If you have any questions, feel free to contact us.</p>
      <p>Best regards,</p>
      <p>Your Company Name</p>
    `;

        await sendEmail(customerEmail, subject, emailHtml);
    } catch (error) {
        console.error('Error generating order success email:', error);
        throw error;
    }
};
