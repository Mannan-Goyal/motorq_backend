import envHandler from './lib/env';

export const PORT = envHandler('PORT');
export const mongoUrl = envHandler('MONGO');
export const jwtSecret = envHandler('JWTSECRET');
export const adminUsername = envHandler('ADMIN_UNAME');
export const adminPassword = envHandler('ADMIN_PASSW');
