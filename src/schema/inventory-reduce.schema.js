import { Schema, Types, model } from 'mongoose';

const inventoryProductSchema = new Schema({
    product_id: {
        type: Types.ObjectId,
    },
    color: {
        type: String,
    },
    size: {
        type: String,
    },
});

const inventoryReduceSchema = new Schema(
    {
        order_id: {
            type: String,
            unique: true,
            index: true,
        },
        order_number: {
            type: String,
            unique: true,
            index: true,
        },
        inventory_products: [inventoryProductSchema],
        customer_id: {
            type: Types.ObjectId,
            ref: 'Customer',
        },
        order_amount: {
            type: Number,
        },
        is_webhook_delivered: {
            type: Boolean,
            index: true,
        },
        stripe: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

export default model('InventoryReduce', inventoryReduceSchema);
