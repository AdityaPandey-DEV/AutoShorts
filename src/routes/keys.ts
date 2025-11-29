import { Router, Response } from 'express';
import { storeApiKey, listMaskedKeys, deleteApiKey } from '../services/secretStore';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /keys
 * Store an encrypted API key
 * Body: { provider: string, value: string }
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { provider, value } = req.body;

    if (!provider || !value) {
      return res.status(400).json({ error: 'provider and value are required' });
    }

    if (typeof provider !== 'string' || typeof value !== 'string') {
      return res.status(400).json({ error: 'provider and value must be strings' });
    }

    // Validate provider name
    const validProviders = ['gemini', 'pexels', 'tts', 'youtube_refresh_token'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ 
        error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` 
      });
    }

    await storeApiKey(userId, provider, value);
    
    logger.info(`Stored API key for user ${userId}, provider: ${provider}`);
    res.json({ ok: true, message: 'API key stored successfully' });
  } catch (error) {
    logger.error('Error storing API key:', error);
    res.status(500).json({ 
      error: 'Failed to store API key',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /keys
 * List all masked API keys for the authenticated user
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const keys = await listMaskedKeys(userId);
    res.json({ keys });
  } catch (error) {
    logger.error('Error listing API keys:', error);
    res.status(500).json({ 
      error: 'Failed to list API keys',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /keys/:provider
 * Delete an API key for a specific provider
 */
router.delete('/:provider', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { provider } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!provider) {
      return res.status(400).json({ error: 'Provider is required' });
    }

    await deleteApiKey(userId, provider);
    
    logger.info(`Deleted API key for user ${userId}, provider: ${provider}`);
    res.json({ ok: true, message: 'API key deleted successfully' });
  } catch (error) {
    logger.error('Error deleting API key:', error);
    res.status(500).json({ 
      error: 'Failed to delete API key',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

