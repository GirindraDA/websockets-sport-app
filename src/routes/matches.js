import { Router } from "express";
import { createMatchSchema, listMatchesQuerySchema } from "../validation/matches.js";
import { getMatchStatus } from "../utils/match-status.js";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { desc } from "drizzle-orm";

export const matchesRouter = Router();

const MAX_LIMIT = 100;

matchesRouter.get("/", async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);

    if (!parsed.success) {
        return res.status(400).json({ error: "Query is invalid", details: JSON.stringify(parsed.error) });
    }

    const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);
    try {
        const data = await db.select().from(matches).orderBy((desc(matches.createdAt))).limit(limit);
        res.status(200).json({ data: data });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch matches", details: parsed.error.issues });
    }

});

matchesRouter.post("/", async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({ error: "Payload is invalid", details: parsed.error.issues });
    }

    const { startTime, endTime, homeScore, awayScore } = parsed.data;

    try {
        const [event] = await db.insert(matches).values({
                ...parsed.data,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                homeScore: homeScore ?? 0,
                awayScore: awayScore ?? 0,
                status: getMatchStatus(startTime, endTime),
            }).returning();

        if(res.app.locals.broadcastMatchCreated){
            res.app.locals.broadcastMatchCreated(event);
        }

        res.status(201).json({ message: "Match created successfully", data: event });
        
    } catch (error) {
        console.error("DB ERROR:", error);
        res.status(500).json({ error: "Failed to create match", details: parsed.error.issues });
    }
});
