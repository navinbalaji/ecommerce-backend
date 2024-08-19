import { Schema, model } from 'mongoose';
import { getPasswordHashed } from '#common';

const customerAddressSchema = new Schema({
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
    address: customerAddressSchema,
});

customerSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = getPasswordHashed(this.password);
    }
    next();
});

export default model('Customer', customerSchema);
