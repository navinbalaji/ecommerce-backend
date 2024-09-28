import { Schema, model } from 'mongoose';

const metaSchema = new Schema(
    {
        shop:{
            type: String,
            default:"prajGeos",
            index: true,
        },
        banner_image: {
            type: String,
            index: true,
        },
        is_banner_image_full: {
            type: Boolean,
            index: true,
        },
        sub_banner_image: {
            type: String,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

export default model('meta', metaSchema);
