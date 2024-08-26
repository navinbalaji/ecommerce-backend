import mongoose from 'mongoose';

// schema
import Customer from '#schema/customer.schema.js';
import Analytics from '#schema/analytics.schema.js';

// utils
import {
    successResponse,
    failureResponse,
    signJwtToken,
    sendEmail,
    generateVerificationToken,
} from '#common';
import verificationTemplate from '#templates/verification.template.js';

import { ROLES } from '#src/constants.js';

/**
 * Handles a POST request to login a  user.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const customer = await Customer.findOne({ email });

        if (!customer) {
            throw new Error('Customer not found');
        }

        const isPasswordValid = await customer.comparePassword(password);

        if (!isPasswordValid) {
            throw new Error('Password incorrect');
        }

        if (!customer.is_verified) {
            throw new Error('Please verify your account information');
        }

        const token = signJwtToken({ cid: customer._id, role: customer.role });

        return res
            .status(200)
            .json(successResponse('Loggedin successfully', { token }));
    } catch (err) {
        return res
            .status(400)
            .json(failureResponse(err.message || 'something went wrong'));
    }
};

/**
 * Handles a POST request to create a new user.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Response}
 */

export const register = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const { name, email, password, phone_number, date_of_birth } = req.body;

        const customerExists = await Customer.exists({ email }).exec();

        if (customerExists) {
            throw new Error('Customer already exists');
        }

        // Create a new customer
        const [customer] = await Customer.create(
            [
                {
                    name,
                    email,
                    password,
                    phone_number,
                    date_of_birth,
                    role: ROLES.USER,
                    is_verified: false,
                },
            ],
            { session }
        );

        // Generate verification token
        const verificationToken = generateVerificationToken({
            customerId: customer._id,
            email: customer.email,
        });

        customer.verification_token = verificationToken;
        await customer.save({ session });

        const mailOptions = {
            subject: 'Verify your email',
            text: verificationTemplate(
                process.env.FRONTEND_BASE_URL,
                verificationToken
            ),
        };

        await sendEmail(customer.email, mailOptions.subject, mailOptions.text);

        // Update analytics
        await Analytics.findOneAndUpdate(
            { name: 'dashboard' },
            { $inc: { total_customers: 1 } },
            { upsert: true, session }
        );

        await session.commitTransaction();

        return res
            .status(200)
            .json(
                successResponse('Customer Registered successfully', customer)
            );
    } catch (err) {
        if (session.inTransaction) {
            await session.abortTransaction();
        }

        return res
            .status(400)
            .json(failureResponse(err?.message || 'Something went wrong'));
    }
};

export const verifyCustomer = async (req, res) => {
    const { token } = req.body;

    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the customer by the ID in the token
        const customer = await Customer.findById(decoded.customerId);

        if (!customer) {
            return res.status(404).json(failureResponse('Customer not found'));
        }

        // Check if the customer has already been verified
        if (customer.is_verified) {
            return res
                .status(400)
                .json(failureResponse('Customer already verified'));
        }

        // Update the customer's verification status
        customer.is_verified = true;
        customer.verification_token = null;
        await customer.save();

        return res
            .status(200)
            .json(successResponse('Email verified successfully'));
    } catch (err) {
        return res
            .status(400)
            .json(
                failureResponse(err?.message || 'Invalid verification token')
            );
    }
};

export const resendVerificationToken = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const { email } = req.body;

        // Find the customer by email
        const customer = await Customer.findOne({ email }, { session });

        if (!customer) {
            return res.status(404).json(failureResponse('Customer not found'));
        }

        // Generate verification token
        const verificationToken = generateVerificationToken({
            customerId: customer._id,
            email: customer.email,
        });

        customer.verification_token = verificationToken;
        await customer.save({ session });

        const mailOptions = {
            subject: 'Verify your email',
            text: verificationTemplate(
                process.env.FRONTEND_BASE_URL,
                verificationToken
            ),
        };

        await sendEmail(customer.email, mailOptions.subject, mailOptions.text);

        await session.commitTransaction();

        return res.status(200).json(successResponse('Verification email sent'));
    } catch (err) {
        if (session.inTransaction) {
            await session.abortTransaction();
        }

        return res
            .status(400)
            .json(
                failureResponse(
                    err?.message || 'Failed to resend verification email'
                )
            );
    }
};
