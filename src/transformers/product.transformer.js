export const productFilterTransform = (uniqueColors, uniqueProductType) => {
    const filters = {
        colors: [],
        productType: [],
    };

    if (uniqueColors?.length > 0) {
        filters.colors = uniqueColors?.map((e) => e['_id']);
    }

    if (uniqueProductType?.length > 0) {
        filters.productType = [...new Set(uniqueProductType?.map((e) => e['_id']?.trim()))];
    }
    return filters;
};
