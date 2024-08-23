import { Schema, model, Types } from 'mongoose';
import { customerAddressSchema } from '#schema/customer.schema.js';
import {PRODUCT_SIZES} from '#constants';

const cartProductsSchema = new Schema({
    product_id: {
        type: Types.ObjectId,
        required:true
    },
    size: {
        type: String,
        enum: PRODUCT_SIZES,
        required:true
    },
    product_name:{
        type: String,
        required:true  
    },
    product_sub_name:{
        type: String,
    },
    product_image:{
        type: String,
        required:true  
    },
    price: {
        type: Number,
        required:true
    },
    color:{
        type: String,
        required:true 
    },
    quantity: {
        type: Number,
        min:1,
        required:true
    },
});

export const cartSchema = new Schema(
    {
        email: {
            type: String,
            index: true,
        },
        customer_id: {
            type: Types.ObjectId,
            ref: 'Customer',
            index: true,
        },
        products: [cartProductsSchema],
        delivery_address: customerAddressSchema,
    },
    {
        timestamps: true,
    }
);

export default model('Cart', cartSchema);
