import { Schema, model } from 'mongoose';

const analyticsSchema = new Schema(
    {
        shop:{
            type: String,
            default:"prajGeos",
            index: true,
        },
        name: {
            type: String,
            default: 'dashboard',
            index: true,
        },
        total_customers: {
            type: Number,
        },
        total_products: {
            type: Number,
        },
        total_orders: {
            type: Number,
        },
        total_order_amount: {
            type: Number,
        },

    },
    {
        timestamps: true,
    }
);

export default model('Analytics', analyticsSchema);
