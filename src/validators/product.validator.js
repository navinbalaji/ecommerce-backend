import * as yup from 'yup';
import {
    GENDER,
    PRODUCT_STATUS,
    PRODUCT_SIZES,
    PRODUCT_WEIGHT_UNIT,
} from '#constants';

const variantSizeSchema = yup.object().shape({
    size: yup.mixed().oneOf(PRODUCT_SIZES).required('Product Size is required'),
    compare_at_price: yup.number().min(1).required('Compare Price is required'),
    price: yup.number().min(1).required('Product Price is required'),
    sku: yup.string().required('SKU is required'),
    inventory_quantity: yup.number().required('Inventory Quantity is required'),
    weight: yup.number().required('Weight is required'),
    weight_unit: yup
        .mixed()
        .oneOf(PRODUCT_WEIGHT_UNIT)
        .required('Weight Unit is required'),
});

const variantImageSchema = yup.object().shape({
    position: yup.number().required('Position is required'),
    src: yup.string().required('Image Source is required'),
});

const variantSchema = yup.object().shape({
    title: yup.string().required('Title is required'),
    color: yup
        .string()
        .matches(/^#([A-Fa-f0-9]{6})$/, 'Color must be a valid 6-character hexadecimal color code')
        .required('Color is required'),
    status: yup
        .mixed()
        .oneOf(PRODUCT_STATUS)
        .required('Variant Status is required'),
    images: yup
        .array()
        .of(variantImageSchema)
        .min(1)
        .required('Images are required'),
    sizes: yup
        .array()
        .of(variantSizeSchema)
        .min(1)
        .required('Sizes are required'),
});

export const productCreateSchema = yup.object().shape({
    title: yup.string().required('Title is required'),
    description:yup.string().required('Description is required'),
    gender: yup.mixed().oneOf(GENDER).required('Gender is required'),
    product_type: yup.string().required('Product Type is required'),
    status: yup
        .mixed()
        .oneOf(PRODUCT_STATUS)
        .required('Product Status is required'),
    tags: yup.array().of(yup.string()).notRequired(),
    image_src: yup.string().required('Product Image is required'),
    size_chart_src: yup.string().required('Size Chart Image is required'),
    variants: yup
        .array()
        .of(variantSchema)
        .min(1)
        .required('Variant is required'),
});
