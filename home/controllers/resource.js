import { getPool } from "../utils/postgres.js";
import logger from "../utils/logger.js";

export async function AddProject(req, res) {
    const pool = getPool();

    try {
        const { name, link } = req.body;

        const query = `insert into projects (name, link) values ($1, $2) returning name, link;`;
        const { rows } = await pool.query(query, [name, link]);

        return res.status(201).json({ [rows[0].name]: rows[0].link });
    } catch (err) {
        logger.error(`Error inserting project: ${err.message}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function GetProject(req, res) {
    const pool = getPool();
    try {
        let query = `select * from projects;`;
        const { rows } = await pool.query(query);

        return res.status(200).json(rows);
    } catch (err) {
        logger.error(`Error retrieving project links: ${err.message}`);
        return res.status(500).json({ message: `Internal Server Error` });
    }
}

export async function GetBlogs(req, res) {
    const pool = getPool();

    try {
        let query = `select title, date, link from blog;`;
        const { rows } = await pool.query(query);

        return res.status(200).json(rows);
    } catch (err) {
        logger.error(`Error retrieving blogs: ${err.message}`);
        return res.status(500).json({ message: `Internal Server Error` });
    }
}
export async function PostBlog(req, res) {
    const pool = getPool();

    try {
        const { title, date, author, tags, link, content } = req.body;

        let query =
            `insert into blog (title, date, author, tags, link, content)
            values ($1, $2, $3, $4, $5, $6) returning title, date, author, link`

        const { rows } = await pool.query(query, [title, date, author, tags, link, content])

        if (rows[0]) return res.status(201).json(rows[0]);
        else throw new Error("Failed to insert into database.")

    } catch (err) {
        logger.error(`Error posting blog: ${err.message}`);
        return res.status(500).json({ message: `Internal Server Error` });
    }
}

export async function GetAbout(req, res) {
    const pool = getPool();
    try {
        const { rows } = await pool.query(`select content, updated_at from about limit 1;`);
        return res.status(200).json(rows[0] ?? { content: "" });
    } catch (err) {
        logger.error(`Error retrieving about content: ${err.message}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function PostAbout(req, res) {
    const pool = getPool();
    try {
        const { content } = req.body;

        const query = `
            with deleted as (delete from about)
            insert into about (content) values ($1)
            returning content, updated_at;
        `;
        const { rows } = await pool.query(query, [content]);

        return res.status(201).json(rows[0]);
    } catch (err) {
        logger.error(`Error updating about content: ${err.message}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function Contact(req, res) {
    const pool = getPool();

    try {
        const { message } = req.body;
        const username = req.username ?? "";
        const date = new Date();

        const query = `
            insert into contact (username, date, message)
            values ($1, $2, $3)
            returning username, date, message;
        `;
        const { rows } = await pool.query(query, [username, date, message]);

        return res.status(201).json(rows[0]);
    } catch (err) {
        logger.error(`Error submitting contact message: ${err.message}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}