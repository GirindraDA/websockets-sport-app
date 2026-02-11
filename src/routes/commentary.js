import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { commentary } from '../db/schema.js';
import { createCommentarySchema, listCommentaryQuerySchema } from '../validation/commentary.js';
import { matchIdParamSchema } from '../validation/matches.js';

const MAX_LIMIT = 100;

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get('/', async (req, res) => {
    const paramsResult = matchIdParamSchema.safeParse(req.params);
    
    if (!paramsResult.success) {
        return res.status(400).json({
            success: false,
            error: 'Invalid match ID parameter',
            details: paramsResult.error.issues,
        });
    }

    const queryResult = listCommentaryQuerySchema.safeParse(req.query);
    
    if (!queryResult.success) {
        return res.status(400).json({
            success: false,
            error: 'Invalid query parameters',
            details: queryResult.error.issues,
        });
    }

    try {
        const { id: matchId } = paramsResult.data;
        const { limit = 10 } = queryResult.data;
        const  safeLimit = Math.min(limit, MAX_LIMIT);

        const result = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, matchId))
            .orderBy(desc(commentary.createdAt))
            .limit(safeLimit);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error fetching commentary:', error.message);
        
        res.status(500).json({
            success: false,
            error: 'Failed to fetch commentary',
            message: error.message,
        });
    }
});

commentaryRouter.post('/', async (req, res) => {
    const paramsResult = matchIdParamSchema.safeParse(req.params);
    
    if (!paramsResult.success) {
        return res.status(400).json({
            success: false,
            error: 'Invalid match ID parameter',
            details: paramsResult.error.issues,
        });
    }

    const bodyResult = createCommentarySchema.safeParse(req.body);

    if (!bodyResult.success) {
        return res.status(400).json({
            success: false,
            error: 'Invalid Payload commentary',
            details: bodyResult.error.issues,
        });
    }

    try {
        const { minute, ...rest } = bodyResult.data;
        const [ result ] = await db
            .insert(commentary)
            .values({
                matchId: paramsResult.data.id,
                minute: minute,
                ...rest,
            })
            .returning();
        
        if(res.app.locals.broadcastCommentary){
            res.app.locals.broadcastCommentary(result.matchId, result);
        }
        // console.log(result);
        res.status(201).json({
            success: true,
            data: result,
        }); 
    } catch (error) {
        console.error('Error creating commentary:', error.message);
        
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create commentary',
            message: error.message,
        });
    }
});

