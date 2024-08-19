// schema
import customerSchema from '#schema/customer.schema.js';

// utils
import {
    successResponse,
    failureResponse,
    verifyPassword,
    signJwtToken,
} from '#common';

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

        const customerData = await customerSchema.findOne({ email });

        if (!customerData) {
            throw new Error('Customer not found');
        }

        const isPasswordValid = verifyPassword(password, customerData.password);

        if (!isPasswordValid) {
            throw new Error('Password incorrect');
        }

        if (!customerData.is_verified) {
            throw new Error('Please verify your account information');
        }

        const token = signJwtToken({ cid: customerData._id });

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

        await customerSchema.create({
            name,
            email,
            password,
            phone_number,
            date_of_birth,
            is_verified: false,
          });
          
        return res
            .status(200)
            .json(successResponse('Customer Registered successfully'));
    } catch (err) {
        return res.status(400).json(failureResponse(err?.message||'something went wrong'));
    }
};
