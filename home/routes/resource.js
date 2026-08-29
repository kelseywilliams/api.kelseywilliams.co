import express from "express";
import {
    AddProject,
    GetProject,
    GetBlogs,
    PostBlog
} from "../controllers/resource.js"
import VerifyValidSession from "../middleware/verifyValidSession.js";
import VerifyAdmin from "../middleware/verifyAdmin.js";
import { check } from "express-validator";
import ValidateRequest from "../middleware/validateRequest.js";
const router = new express.Router();

router.post("/projects",
    VerifyValidSession,
    VerifyAdmin,
    check("name").isString().trim().notEmpty().isLength({ max: 255 }),
    check("link").isString().trim().notEmpty().isLength({ max: 255 }),
    ValidateRequest,
    AddProject
);

router.get("/projects",
    GetProject
);

router.get("/blog_list",
    GetBlogs
)

router.post("/blog",
    VerifyValidSession,
    VerifyAdmin,
    check("title").isString().trim().notEmpty().isLength({ max: 255 }),
    check("date").isISO8601(),
    check("author").isString().trim().notEmpty().isLength({ max: 64 }),
    check("tags").isArray({ max: 64 }),
    check("tags.*").isString().trim().isLength({ max: 50 }),
    check("link").isString().trim().notEmpty().isLength({ max: 255 }),
    check("content").isString().trim().notEmpty().isLength({ max: 5000 }),
    ValidateRequest,
    PostBlog
)

export default router;