// Validation helper functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/; // Indian phone number format
  return phoneRegex.test(phone.replace(/[^0-9]/g, ""));
};

export const validatePincode = (pincode: string): boolean => {
  const pincodeRegex = /^[1-9][0-9]{5}$/; // Indian pincode format
  return pincodeRegex.test(pincode);
};

export const validateRequired = (value: string | undefined | null): boolean => {
  return !!value && value.trim().length > 0;
};

export const validatePositiveNumber = (value: number | string): boolean => {
  const num = typeof value === "string" ? Number.parseFloat(value) : value;
  return !Number.isNaN(num) && num >= 0;
};

export const validatePositiveInteger = (value: number | string): boolean => {
  const num = typeof value === "string" ? Number.parseInt(value) : value;
  return Number.isInteger(num) && num >= 0;
};
