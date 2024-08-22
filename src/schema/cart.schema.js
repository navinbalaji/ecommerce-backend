import { Schema, model, Types } from 'mongoose';

const cartProductsSchema = new Schema({
    product_id: {
        type: Types.ObjectId,
    },
    quantity: {
        type: Number,
    },
});

export const cartSchema = new Schema(
    {
        email: {
            type: string,
            index: true,
        },
        products: [cartProductsSchema],
    },
    {
        timestamps: true,
    }
);

export default model('Cart', cartSchema);
