import * as yup from 'yup';
import { PRODUCT_SIZES } from '#constants';

const cartProductValidator = yup.object().shape({
    product_id: yup.string().required('Product Id is required'),
    size: yup.mixed().oneOf(PRODUCT_SIZES).required('Product Size is required'),
    quantity: yup.number().min(1).required('Product Quantity is required'),
});

const deliveryAddressValidator = yup.object().shape({
    line1: yup.string().required("Address Line 1 is required"),
    line2: yup.string().notRequired(),
    landmark: yup.string().notRequired(),
    city: yup.string().required("City is required"),
    state: yup.string().required("State is required"),
    country: yup.string().required("Country is required"),
    pincode: yup.number().required("Pincode is required"),
});

export const cartCreateValidator = yup.object().shape({
    email: yup.string().email().required('Email is required'),
    customer_id: yup.string().required('Customer Id is required'),
    products: yup
        .array()
        .of(cartProductValidator)
        .min(1, 'Minimum 1 product is required')
        .required('Products are required'),
    new_delivery_address: yup.object().when('is_default_address', {
        is: false,
        then: () => deliveryAddressValidator.required('Delivery address is required'),
        otherwise: () => yup.object().notRequired(),
    }),
    is_default_address: yup
        .boolean()
        .required('Default Address toggle is required'),
});
