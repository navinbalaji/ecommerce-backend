import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';

import connectDB from './db/mongoose.js';

// middleware
import tokenExpirationMiddleware from "./middleware/jwtToken.js"

// routes
import authRouter from './controllers/auth/auth.controller.js';
import productRouter from './controllers/product/product.controller.js';
import customerRouter from './controllers/customer/customer.controller.js';
import orderRouter from './controllers/order/order.controller.js';
import cartRouter from './controllers/cart/cart.controller.js';
import stripeRouter from './controllers/stripe/stripe.controller.js';
import imageRouter from './controllers/image/image.controller.js';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(
    cors({
        origin: '*',
    })
);
app.use(morgan('tiny'));
app.use(express.json())
app.get('/ping', (_, res) => res.status(200).send('pong'));
app.use('/auth', authRouter);
app.use('/product', productRouter);
app.use('/stripe', stripeRouter);

/**
 * Middleware token handle
 */


app.use(tokenExpirationMiddleware)
/**
 * Routes
 */

app.use('/customer', customerRouter);
app.use('/cart', cartRouter);
app.use('/order', orderRouter);
app.use('/image', imageRouter);

app.listen(PORT, () => {
    // init database
    connectDB()
    console.log('Server is running on PORT ', PORT);
});
