import express from "express";
import { Register, Login, VerifyUser, VerifyAdmin, Logout, Delete } from "../controllers/auth.js";
import Validate from "../middleware/validateRequest.js";
import Verify from "../middleware/verify.js";
import VerifyRole from "../middleware/verifyRole.js";
import { check } from "express-validator";

const router = express.Router();

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
    Validate,
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
    Validate,
    Login
);

router.post(
    "/user", 
    Verify, 
    VerifyUser
);

router.post(
    "/admin", 
    Verify, 
    VerifyRole, 
    VerifyAdmin
)

router.post(
    "/logout",
    Verify,
    Logout
)

router.post(
    "/delete",
    Verify,
    Delete
)
export default router;
