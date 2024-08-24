import { Schema, model } from 'mongoose';


const imageSchema = new Schema(
    {
        name: {
            type: String,
            unique: true,
            index: true,
        },
        url: {
            type: String,
            unique: true,
            index: true,
        }
    },
    {
        timestamps: true,
    }
);

export default model('Image', imageSchema);
