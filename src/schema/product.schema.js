import { Schema, model } from 'mongoose';
import {
    GENDER,
    PRODUCT_STATUS,
    PRODUCT_SIZES,
    PRODUCT_WEIGHT_UNIT,
} from '#constants';

const variantImageSchema = new Schema({
    position: {
        type: Number,
    },
    src: {
        type: String,
    },
});

const variantSizeSchema = new Schema({
    size: {
        type: String,
        enum: PRODUCT_SIZES,
    },
    compare_at_price: {
        type: Number,
    },
    price: {
        type: Number,
    },
    sku: {
        type: String,
        index: true,
    },
    inventory_quantity: {
        type: Number,
    },
    weight: {
        type: Number,
    },
    weight_unit: {
        type: String,
        enum: PRODUCT_WEIGHT_UNIT,
    },
});

const variantSchema = new Schema({
    title: {
        type: String,
        index: true,
    },
    color: {
        type: String,
        index: true,
    },
    status: {
        type: String,
        enum: PRODUCT_STATUS,
        index: true,
    },
    images: [variantImageSchema],
    sizes: [variantSizeSchema],
});

const productSchema = new Schema(
    {
        title: {
            type: String,
            index: true,
        },
        gender: {
            type: String,
            enum: GENDER,
            index: true,
        },
        product_type: {
            type: String,
            index: true,
        },
        status: {
            type: String,
            enum: PRODUCT_STATUS,
            index: true,
        },
        tags: {
            type: [String],
            index: true,
        },
        variants: [variantSchema],
    },
    {
        timestamps: true,
    }
);

export default model('Products', productSchema);
