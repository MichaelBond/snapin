// This extends Request in Express to include error to get rid of those logs
declare namespace Express {
    export interface Request {
        user: any
    }
}