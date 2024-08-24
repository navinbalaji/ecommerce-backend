import * as yup from 'yup';

export const imageInsertSchema = yup.object().shape({
    name: yup
        .string()
        .required('Name is required'),
    imageBase64: yup
        .string()
        .required('Image Base64 is required')
        .test('isBase64', 'Invalid base64 string', (value) => {
            try {
                // Attempt to decode the base64 string
                atob(value);
                return true;
            } catch (err) {
                return false;
            }
        }),
});
