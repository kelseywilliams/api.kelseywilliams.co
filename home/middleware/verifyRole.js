import { ADMIN, USER } from "../config/index.js";
export default function VerifyRole(req, res, next){
    try{
        const user = req.user
        if (user.role != ADMIN) {
            return res.status(401).json({
                status: false, 
                message: "Insufficient privileges."
            });
        }
        next();
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: "Internal server error."
        });
    }
}