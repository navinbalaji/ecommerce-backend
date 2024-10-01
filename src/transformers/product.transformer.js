export const productFilterTransform = (uniqueColors, uniqueProductType,gender,sizes) => {
    const filters = {
        colors: [],
        productType: [],
        gender:[],
        sizes:[]
    };

    if (uniqueColors?.length > 0) {
        filters.colors = uniqueColors?.map((e) => e['_id']);
    }

    if (uniqueProductType?.length > 0) {
        filters.productType = [...new Set(uniqueProductType?.map((e) => e['_id']?.trim()))];
    }


    if (gender?.length > 0) {
        filters.gender = gender
    }

    if (sizes?.length > 0) {
        filters.sizes = sizes
    }
    return filters;
};
