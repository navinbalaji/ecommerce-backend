import * as yup from 'yup';

export const metaUpdate = yup.object().shape({
    banner_image: yup.string().required().label('Banner Image'),
    is_banner_image_full: yup.boolean().required().label('Banner Image Full'),
    sub_banner_image: yup.string().required().label('Sub Banner Image'),
});
