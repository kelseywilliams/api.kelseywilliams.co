import express from "express";
import { 
    Register, 
    Login, 
    VerifyUser, 
    VerifyAdminCtlr, 
    Logout, 
    Delete, 
    SendCodeCtlr, 
    RecoveryCodeCtlr,
    ResetPassword
} from "../controllers/auth.js";
import ValidateRequest from "../middleware/validateRequest.js";
import VerifyValidSession from "../middleware/verifyValidSession.js";
import VerifyAdmin from "../middleware/verifyAdmin.js";
import SendRegisterCode from "../middleware/sendRegisterCode.js";
import ValidateRegisterCode from "../middleware/validateRegisterCode.js";
import ValidateRecoveryCode from "../middleware/validateRecoveryCode.js";
import sendRecoveryCode from "../middleware/sendRecoveryCode.js"
import { check } from "express-validator";

const router = express.Router();
router.post(
    "/send-code",
    check("email")
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),
    SendRegisterCode,
    SendCodeCtlr
)
router.post(
    "/register",
    check("email")
        .isEmail()
        .withMessage("Enter a valid email address")
        .normalizeEmail(),
    check("username")
        .not()
        .isEmpty()
        .withMessage("Username is required")
        .trim()
        .escape(),
    check("password")
        .notEmpty()
        .isLength({min: 8 })
        .withMessage("Must be at lest 8 chars long"),
    ValidateRegisterCode,
    ValidateRequest,
    Register
);

router.post(
    "/login",
    check("email")
        // The .if() method takes a condition. If the condition is false, this validation chain is skipped.
        .if(({ req }) => !req.body.username) 
        .isEmail()
        .withMessage("Enter a valid email address (if username is not provided)")
        .normalizeEmail(),
        
    // 3. Conditional Username Validation: Only run if 'email' is empty.
    check("username")
        .if(({ req }) => !req.body.email) 
        .not()
        .isEmpty() // Check if it's not empty, now that we're running conditionally
        .withMessage("Username is required (if email is not provided)"),
    check("password").not().isEmpty(),
    ValidateRequest,
    Login
);

router.post(
    "/user", 
    VerifyValidSession, 
    VerifyUser
);

router.post(
    "/admin", 
    VerifyValidSession, 
    VerifyAdmin, 
    VerifyAdminCtlr
)

router.post(
    "/logout",
    VerifyValidSession,
    Logout
)

router.post(
    "/delete",
    VerifyValidSession,
    Delete
)

router.post(
    "/send-recovery",
    sendRecoveryCode,
    RecoveryCodeCtlr
)
router.post(
    "/forgot",
    ValidateRecoveryCode,
    ResetPassword
)
export default router;
