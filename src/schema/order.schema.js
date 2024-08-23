import { Schema, Types, model } from 'mongoose';
import { customerAddressSchema } from '#schema/customer.schema.js';
import { cartSchema } from '#schema/cart.schema.js';

const orderSchema = new Schema(
    {
        order_id: {
            type: String,
            index: true,
        },
        order_amount: {
            type: Number,
            index: true,
        },
        customer_id: {
            type: Types.ObjectId,
            ref: 'Customer',
            index: true,
        },
        cart: cartSchema,
        is_delivered: {
            type: Boolean,
            index: true,
        },
        is_cancelled: {
            type: Boolean,
            index: true,
        },
        is_fullfilled: {
            type: Boolean,
            index: true,
        },
        is_payment_completed:{
            type: Boolean,
            index: true,  
        },
        delivery_address: customerAddressSchema,
    },
    {
        timestamps: true,
    }
);

export default model('Order', orderSchema);
