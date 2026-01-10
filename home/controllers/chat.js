import { getPool } from "../utils/postgres.js";
import logger from "../utils/logger.js";

export async function Create(req, res){
    const pool = await getPool();

    try {
        const username = req.username;
        const { room, content } = req.body;

        if (!room || typeof room !== "string" || !room.trim()){
            return res.status(400).json({
                message: "Room is required."
            });
        }
        if (!content || typeof content !== "string" || !content.trim()){
            return res.status(400).json({
                message: "Chat content is required."
            });
        }

        const query = `
            insert into chats (username, room, content)
            values ($1, $2, $3)
            returning id, username, room, content, created_at;
        `;

        const { rows } = await pool.query(query, [username, room.trim(), content.trim()]);
        const message = rows[0];

        return res.status(201).json(message);
    } catch(err) {
        logger.error("Error creating chat:", err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

export async function GetNext(req, res){
    const pool = getPool();

    try {
        const { last_seen_id } = req.body;

        if(last_seen_id === null || last_seen_id < 0){
            return res.status(400).json({
                message: "Last seen id must not be empty or negative."
            })
        }

        const query = `
            select m.id,
                m.username,
                u.username as display_username,
                m.content,
                m.created_at
            from chats m
            join users u on m.username = u.username
            where m.deleted_at is null
            and m.id > $1
            order by m.id asc
            limit 100;
        `;

        const { rows } = await pool.query(query, [last_seen_id]);

        return res.status(200).json({
            chats: rows,
            count: rows.length,
        })
    } catch(err) {
        logger.error("Failed to load chats.", err);
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

export async function Delete(req, res){
    const pool = await getPool();
    const username = req.username;
    logger.info(req?.admin);
    const userRole = (req?.admin) ? "admin" : "user"
    logger.info(userRole);
    try {
        const { id } = req.body;

        if(!id){
            return res.status(400).json({
                message: "Message id to delete cannot be empty"
            });
        }

        let query = `
            update chats
            set deleted_at = NOW()
            where id = $1
                and (username = $2 or $3 = 'admin')
                and deleted_at is NULL
            returning id, username, deleted_at;
        `;

        const { rows } = await pool.query(query, [id, username, userRole]);
        const deleted = rows[0];

        if (!deleted) {
            return res.status(404).json({
                message: "Chat was not found or user not logged in."
            })
        }

        //logger.info(`Chat ${deleted.id} deleted by user ${deleted.username}`);

        return res.status(200).json({
            id: deleted.id,
            deleted_at: deleted.deleted_at,
        })
    } catch (err) {
        logger.error("Error deleting chat:", err);
        return res.status(500).json({
            message: "Internal Server Error",
        })
    }
}