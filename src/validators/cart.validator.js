import * as yup from 'yup';

const cartProductValidator = yup.object().shape({
    product_id: yup.string().required('Product Id is required'),
    size: yup.mixed().oneOf(PRODUCT_SIZES).required('Product Size is required'),
    quantity: yup.number().min(1).required('Product Quantity is required'),
});

const deliveryAddressValidator = yup.object().shape({
    line1: yup.string().notRequired(),
    line2: yup.string().notRequired(),
    landmark: yup.string().notRequired(),
    city: yup.string().notRequired(),
    state: yup.string().notRequired(),
    country: yup.string().notRequired(),
    pincode: yup.number().notRequired(),
});

export const cartCreateValidator = yup.object().shape({
    email: yup.string().email().required('Email is required'),
    customer_id: yup.string().required('Customer Id is required'),
    products: yup
        .array()
        .of(cartProductValidator)
        .min(1, 'Minimum 1 product is required')
        .required('Products is required'),
    new_delivery_address: yup.object(deliveryAddressValidator).when('is_default_address', {
        is: false,
        then: yup.object(deliveryAddressValidator).required('Delivery address is required'),
        otherwise: yup.object(deliveryAddressValidator).notRequired(),
    }),
    is_default_address: yup
        .boolean()
        .required('Default Address toggle is required'),
});
