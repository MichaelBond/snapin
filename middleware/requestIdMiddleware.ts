import { v4 as uuidv4 } from 'uuid';
import { createNamespace } from 'cls-hooked';
import { Request, Response, NextFunction } from 'express';

// This needs to seperated between the namespace and the middleware
// but for now it is what t is 


// Create a CLS namespace to store the request-scoped variables
const requestNamespace = createNamespace('request-namespace');

// Middleware to generate and store a request ID
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Generate a new request ID
    const requestId = uuidv4();
    console.log('req.user: ', req.user)
    // Run the next middleware within the CLS namespace context
    requestNamespace.run(() => {
        // Store the request ID in the namespace
        requestNamespace.set('requestId', requestId);
        requestNamespace.set('session-user', req.user)
        next();
    });
};

// Helper function to retrieve the current request ID
export const getRequestId = () => {
    return requestNamespace.get('requestId');
};

// This needs to be figured out, not currently working
export const getCurrentUser = () => {
    return requestNamespace.get('session-user')
}