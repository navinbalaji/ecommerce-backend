import * as yup from 'yup';

export const loginSchema = yup.object().shape({
    email: yup
        .string()
        .email('Invalid email address')
        .required('Email is required'),
    password: yup
        .string()
        .min(6, 'Password must be at least 6 characters long')
        .required('Password is required'),
});

export const registerSchema = yup.object().shape({
    name: yup.string().required('Name is required'),
    email: yup
        .string()
        .email('Invalid email address')
        .required('Email is required'),
    password: yup
        .string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
    phone_number: yup.string().required('Phone Number is required'),
    date_of_birth: yup.date().required('Date of Birth is required'),
    address: yup.object().shape({
        line1: yup.string().notRequired(),
        line2: yup.string().notRequired(),
        landmark: yup.string().notRequired(),
        city: yup.string().notRequired(),
        state: yup.string().notRequired(),
        country: yup.string().notRequired(),
        pincode: yup.number().notRequired(),
    }),
});

export const customerUpdateSchema = yup.object().shape({
    name: yup.string().required('Name is required'),
    phone_number: yup.string().required('Phone Number is required'),
    date_of_birth: yup.date().required('Date of Birth is required'),
    address: yup.object().shape({
        line1: yup.string().required('Address line 1 is required'),
        line2: yup.string().notRequired(),
        landmark: yup.string().notRequired(),
        city: yup.string().required('City is required'),
        state: yup.string().required('State is required'),
        country: yup.string().required('Country is required'),
        pincode: yup.number().required('Pincode is required'),
    }),
});
