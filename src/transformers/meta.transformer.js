export const metaTransform = (meta) => ({
    id: meta._id,
    banner_image: meta.banner_image,
    is_banner_image_full:meta.is_banner_image_full,
    sub_banner_image:meta.sub_banner_image
});
