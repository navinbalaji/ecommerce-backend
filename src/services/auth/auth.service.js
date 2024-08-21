// schema
import Customer from '#schema/customer.schema.js';

// utils
import {
    successResponse,
    failureResponse,
    signJwtToken,
} from '#common';

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

        const token = signJwtToken({ cid: customer._id,role:customer.role });

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
    try {
        const { name, email, password, phone_number, date_of_birth } = req.body;

        // TODO: Send Verification Email

        await Customer.create({
            name,
            email,
            password,
            phone_number,
            date_of_birth,
            role:ROLES.USER,
            is_verified: false,
          });
          
        return res
            .status(200)
            .json(successResponse('Customer Registered successfully'));
    } catch (err) {
        return res.status(400).json(failureResponse(err?.message||'something went wrong'));
    }
};
