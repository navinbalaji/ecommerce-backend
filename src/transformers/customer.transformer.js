export const customerTransform = (customer) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone_number: customer.phone_number,
    date_of_birth: customer.date_of_birth,
    is_verified: customer.is_verified,
});
