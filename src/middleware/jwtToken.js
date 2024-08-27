import { failureResponse, verifyJwtToken } from '#src/common.js';
import { ROLE } from '#src/constants.js';

const tokenExpirationMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader?.split(' ')?.[1] || null;
    if (!token) {
        return res
            .status(401)
            .json(failureResponse('Access denied. No token provided.'));
    }

    try {
        const decoded = verifyJwtToken(token, process.env.JWT_SECRET_KEY);
        req.user = decoded;

        if (!ROLE.includes(req.user.role)) {
            return res
                .status(403)
                .json(failureResponse('Forbidden. unknown role.'));
        }

        next();
    } catch (ex) {
        if (ex.name === 'TokenExpiredError') {
            return res
                .status(401)
                .json(
                    failureResponse('Token has expired. Please login again.')
                );
        }
        return res.status(400).json(failureResponse('Invalid token.'));
    }
};

export default tokenExpirationMiddleware;
