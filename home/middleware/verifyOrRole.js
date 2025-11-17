import Verify from "./verify.js";
import VerifyRole from "./verifyRole.js";

export default function VerifyOrRole(req, res, next) {
    // === Attempt #1: RUN VERIFY ===
    Verify(req, res, (err) => {
        // If Verify responded already (401, 500, etc), STOP EVERYTHING
        if (res.headersSent) return;

        // If Verify called next() successfully → user is authenticated
        if (!err) return next();

        // === Attempt #2: RUN VERIFY ROLE ===
        VerifyRole(req, res, (err2) => {
            // If VerifyRole responded already (403, 500), STOP EVERYTHING
            if (res.headersSent) return;

            // If VerifyRole succeeded → allow
            if (!err2) return next();

            // BOTH failed and neither sent a response
            return res.status(403).json({ message: "Unauthorized." });
        });
    });
}
