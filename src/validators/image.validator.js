import * as yup from 'yup';

export const imageInsertSchema = yup.object().shape({
    name: yup
        .string()
        .required('Name is required'),
    imageBase64: yup
        .string()
        .required('Image Base64 is required')
        .matches(/^data:image\/(png|jpg|jpeg|gif);base64,/, 'Invalid Data URI format')
        .test('isBase64', 'Invalid base64 string', (value) => {
            if (!value) return false; // Handle empty value case
            const base64String = value.split(',')[1]; // Extract the base64 part
            try {
                atob(base64String);
                return true;
            } catch (err) {
                return false;
            }
        }),
});
