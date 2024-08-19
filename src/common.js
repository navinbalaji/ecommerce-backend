import { scryptSync, randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

export const successResponse = (message, data) => ({
    message,
    data,
});

export const failureResponse = (message, data) => ({
    message,
    data
});

const salt = randomBytes(16).toString('hex');

export const getPasswordHashed = (password) =>
    scryptSync(password, salt, 32).toString('hex');

export const verifyPassword = (inputPassword, storedHash) => {
    const inputHash = getPasswordHashed(inputPassword);
    return inputHash === storedHash;
};

export const signJwtToken = (data) => {
    return jwt.sign(data, process.env.JWT_SECRET_KEY, { expiresIn: '10h' });
};

export const verifyJwtToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET_KEY);
};

export const validate = (schema) => async (req, res, next) => {
    try {
        await schema.validate(req.body, { abortEarly: false });
        next();
    } catch (err) {
        return res
            .status(400)
            .json(failureResponse(err.message || 'Something went wrong', { err: err.errors }));
    }
};
