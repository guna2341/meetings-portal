

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export const validateEmail = (email?: string): boolean =>
  !!email && emailRegex.test(email);
