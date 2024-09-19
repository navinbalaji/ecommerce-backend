import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import { ROLE } from '#constants';

export const customerAddressSchema = new Schema({
    line1: {
        type: String,
        default: '',
    },
    line2: {
        type: String,
        default: '',
    },
    landmark: {
        type: String,
        default: '',
    },
    city: {
        type: String,
        default: '',
    },
    state: {
        type: String,
        default: '',
    },
    country: {
        type: String,
        default: '',
    },
    pincode: {
        type: Number,
        default: 0,
    },
});

const customerSchema = new Schema(
    {
        name: {
            type: String,
            index: true,
        },
        email: {
            type: String,
            unique: true,
            index: true,
        },
        password: {
            type: String,
            index: true,
        },
        phone_number: {
            type: String,
            index: true,
        },
        date_of_birth: {
            type: String,
            index: true,
        },
        role: {
            type: String,
            enum: ROLE,
            index: true,
        },
        address: {
            type: customerAddressSchema,
            default: () => ({}),
        },
        is_verified: {
            type: Boolean,
        },
        verification_token: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

customerSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

customerSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

export default model('Customer', customerSchema);
