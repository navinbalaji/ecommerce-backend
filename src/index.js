import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';

import connectDB from './db/mongoose.js';

// routes
import authRouter from './controllers/auth/auth.controller.js';

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

/**
 * Middleware token handle
 */

app.use('/auth', authRouter);

app.listen(PORT, () => {
    // init database
    connectDB()
    console.log('Server is running on PORT ', PORT);
});
