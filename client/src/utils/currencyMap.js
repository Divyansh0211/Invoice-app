export const currencyMap = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'INR': '₹',
    'JPY': '¥'
};

export const getCurrencySymbol = (currencyCode) => {
    return currencyMap[currencyCode] || '$';
};
