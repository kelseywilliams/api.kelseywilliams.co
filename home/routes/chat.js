import express from "express";
import { Create, GetNext, Delete } from "../controllers/chat.js";
import VerifyValidSession from "../middleware/verifyValidSession.js";
import VerifyAdmin from "../middleware/verifyAdmin.js";
const router = new express.Router();

// Verify that user is logged in before a allowing a post to be made.
// Then assign IDs to chats sequentially. 
// Creates the post and returns the id of the chat.  
// The client is then free to broadcast its id and message to the rest of the app.

router.post("/new",
    VerifyValidSession,
    Create
);

// Return the next 100 posts starting from a given ID
router.post("/read",
    GetNext
);

// Verify if chat is users own.  Else check if user is admin
// If one of these passes, we can soft delete the account
router.post("/delete",
    VerifyValidSession,        // Adds req.username from jwt
    VerifyAdmin,                // Sets req.admin to true if admin
    Delete                     // Delete can handle not having req.admin set
);

export default router;