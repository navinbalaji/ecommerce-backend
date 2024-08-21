import { failureResponse } from '#src/common.js';

const roleMiddleware = (requiredRole) => {
    return (req, res, next) => {
        if (requiredRole && req.user.role !== requiredRole) {
            return res
                .status(403)
                .json(
                    failureResponse(
                        'Forbidden. Only admins can access this route.'
                    )
                );
        }
        next();
    };
};

export default roleMiddleware;
