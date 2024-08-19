import { failureResponse } from '#src/common.js';
import jwt from 'jsonwebtoken';

const tokenExpirationMiddleware = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json(failureResponse('Access denied. No token provided.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (ex) {
    if (ex.name === 'TokenExpiredError') {
      return res.status(401).json(failureResponse('Token has expired. Please login again.'));
    }
    return res.status(400).json(failureResponse('Invalid token.'));
  }
};

export default tokenExpirationMiddleware;
