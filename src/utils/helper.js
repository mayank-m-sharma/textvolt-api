
export const formatPhoneNumber = (phone) => {
    if (/^\+1\d{10}$/.test(phone)) {
        return phone;
    }
    const digits = phone?.replace(/\D/g, '');
    const cleaned = digits.startsWith('1') && digits.length === 11
        ? digits.slice(1)
        : digits;
    return `+1${cleaned}`;
}
