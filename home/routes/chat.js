import express from "express";
import { Create, GetNext, Delete } from "../controllers/chat.js";
import Synchro from "../middleware/synchro.js";
import Verify from "../middleware/verify.js";
import VerifyRole from "../middleware/verifyRole.js";
import VerifyOrRole from "../middleware/verifyOrRole.js";
const router = new express.Router();

// Verify that user is logged in before a allowing a post to be made.
// Then assign IDs to chats sequentially.  Synchro will ensure that any chats
// made at the same time will be sorted by creation time and assigned ids
// Creates the post and returns the id of the chat.  
// The client is then free to broadcast its id and message to the rest of the app.

router.post("/new",
    Verify,
    Create
);

// Return the next 100 posts starting from a given ID
router.post("/read",
    GetNext
);

// Verify if chat is users own.  Else check if user is admin
// If one of these passes, we can soft delete the account
router.post("/delete",
    VerifyOrRole,
    Delete
);

export default router;