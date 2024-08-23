import { Schema, model, Types } from 'mongoose';


export const bestSellingSchema = new Schema(
    {
        product_id: {
            type: Types.ObjectId,
            required:true
        },
        quantity: {
            type: Number,
            required:true
        },
    },
    {
        timestamps: true,
    }
);

export default model('BestSelling', bestSellingSchema);
