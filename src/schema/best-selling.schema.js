import { Schema, model, Types } from 'mongoose';


export const bestSellingSchema = new Schema(
    {
        product_id: {
            type: Types.ObjectId,
            index:true,
            required:true
        },
        quantity: {
            type: Number,
            index:true,
            required:true
        },
    },
    {
        timestamps: true,
    }
);

export default model('bestSelling', bestSellingSchema);
