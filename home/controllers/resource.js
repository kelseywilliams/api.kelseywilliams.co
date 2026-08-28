import { getPool } from "../utils/postgres.js";
import logger from "../utils/logger.js";

export async function AddProject(req, res) {
    const pool = getPool();

    try {
        const {name, link} = req.body;

        const query = `insert into projects (name, link) values ($1, $2) returning name, link;`;
        const { rows } = await pool.query(query, [name, link]);

        return res.status(201).json({ [rows[0].name]: rows[0].link });
    } catch (err) {
        logger.error(`Error inserting project: ${err.message}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function GetProjectCtlr(req, res) {
    const pool = getPool();
    try {
        let query = `select * from projects;`;
        const { rows } = await pool.query(query);

        const projects = Object.fromEntries(rows.map(r => [r.name, r.link]));
        return res.status(200).json(projects);
    } catch (err) {
        logger.error(`Error retrieving project links: ${err.message}`);
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