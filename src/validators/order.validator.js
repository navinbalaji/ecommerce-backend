import * as yup from 'yup';



export const orderCreate = yup.object().shape({
    email: yup.string().email().required("Email is required"),
})

export const orderUpdate= yup.object().shape({
    is_delivered: yup.boolean().notRequired(),
    is_cancelled: yup.boolean().notRequired(),
    is_fullfilled: yup.boolean().notRequired(),
}).test('at-least-one', 'At least one of is_delivered, is_cancelled, or is_fullfilled must be true', function (value) {
    return value.is_delivered || value.is_cancelled || value.is_fullfilled;
});
