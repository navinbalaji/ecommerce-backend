import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import { ROLE } from '#constants';

export const customerAddressSchema = new Schema({
    line1: {
        type: String,
    },
    line2: {
        type: String,
    },
    landmark: {
        type: String,
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    country: {
        type: String,
    },
    pincode: {
        type: Number,
    },
});

const customerSchema = new Schema({
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
    address: customerAddressSchema,
    is_verified: {
        type: Boolean,
    },
},{
    timestamps:true
});

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
