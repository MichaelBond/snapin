import { Request, Response, NextFunction } from "express";
export default (req: Request, res: Response, next: NextFunction) => {
    console.log('here ===> ',)
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}