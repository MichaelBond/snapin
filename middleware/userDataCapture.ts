import { createNamespace } from 'cls-hooked';
import { Request, Response, NextFunction } from 'express';

// This needs to seperated between the namespace and the middleware
// but for now it is what t is 


// Create a CLS namespace to store the request-scoped variables
const userNamespace = createNamespace('request-user');

// Middleware to generate and store a request ID
export const userStoreMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Run the next middleware within the CLS namespace context
    userNamespace.run(() => {
        // Store the request ID in the namespace
        userNamespace.set('user', req.user);
        next();
    });
};

// Helper function to retrieve the current request ID
export const getUser = () => {
    return userNamespace.get('user');
};