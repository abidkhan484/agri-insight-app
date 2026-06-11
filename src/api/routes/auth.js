import {
  validateTelegramInitData,
  validateTelegramOAuthData,
  generateSupabaseJWT,
  parseTelegramUser,
} from '../../services/auth.js';
import { dbService } from '../../db/service.js';
import supabaseAuth from '../../db/authClient.js';
import logger from '../../config/logger.js';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Builds the public user object returned to the client.
 * @param {{ id: number|string, first_name?: string, language_code?: string, email?: string }} raw
 */
function buildUserResponse(raw) {
  return {
    id: raw.id,
    first_name: raw.first_name || '',
    language_code: raw.language_code || 'bn',
    ...(raw.email ? { email: raw.email } : {}),
  };
}

// ---------------------------------------------------------------------------
// Route handlers — each is a standard (req, res, next) function
// ---------------------------------------------------------------------------

/**
 * POST /api/auth/register
 * Email + password registration via Supabase Auth.
 * Also creates a row in the `farmers` table.
 */
export async function registerWithEmail(req, res) {
  const { email, password, name } = req.body || {};

  if (!email || !password) {
    res.json(400, { error: 'email and password are required' });
    return;
  }

  if (password.length < 8) {
    res.json(400, { error: 'password must be at least 8 characters' });
    return;
  }

  try {
    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: { name: name || '' },
      },
    });

    if (authError) {
      logger.warn('Email registration failed (Supabase Auth)', { error: authError.message });
      // Return a clean message; never expose raw Supabase errors to clients
      res.json(400, { error: authError.message });
      return;
    }

    const supabaseUser = authData.user;
    if (!supabaseUser) {
      logger.error('Email registration: Supabase returned no user object');
      res.json(500, { error: 'Registration failed. Please try again.' });
      return;
    }

    // 2. Upsert farmer row keyed on auth_user_id (not telegram_id for email accounts)
    await dbService.upsertFarmerByAuthId(supabaseUser.id, {
      name: name || email.split('@')[0],
      email,
    });

    logger.info('Email registration success', { userId: 'user:' + supabaseUser.id });

    // 3. Return JWT (same format as Telegram auth — uses the Supabase session token)
    const token = authData.session?.access_token;

    res.json(201, {
      token,
      user: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        first_name: name || email.split('@')[0],
        language_code: 'bn',
      },
    });
  } catch (error) {
    logger.error('Email registration error', { error: error.message });
    res.json(500, { error: 'Internal server error' });
  }
}

/**
 * POST /api/auth/login
 * Email + password login via Supabase Auth.
 */
export async function loginWithEmail(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    res.json(400, { error: 'email and password are required' });
    return;
  }

  try {
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      logger.warn('Email login failed', { error: authError.message });
      // Return generic message to avoid user-enumeration
      res.json(401, { error: 'ইমেইল বা পাসওয়ার্ড ভুল। (Invalid email or password.)' });
      return;
    }

    const supabaseUser = authData.user;
    const session = authData.session;

    // Ensure farmer row exists (idempotent)
    await dbService.upsertFarmerByAuthId(supabaseUser.id, {
      email: supabaseUser.email,
    });

    logger.info('Email login success', { userId: 'user:' + supabaseUser.id });

    res.json(200, {
      token: session.access_token,
      user: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        first_name: supabaseUser.user_metadata?.name || supabaseUser.email.split('@')[0],
        language_code: 'bn',
      },
    });
  } catch (error) {
    logger.error('Email login error', { error: error.message });
    res.json(500, { error: 'Internal server error' });
  }
}

/**
 * POST /api/auth/telegram
 * Telegram Mini App (TMA) authentication via Telegram WebApp initData.
 */
export async function loginWithTelegramTMA(req, res) {
  const { initData } = req.body || {};

  if (!validateTelegramInitData(initData)) {
    logger.warn('TMA Auth Failed: Invalid initData');
    res.json(401, { error: 'Invalid Telegram data' });
    return;
  }

  const user = parseTelegramUser(initData);
  if (!user || !user.id) {
    logger.warn('TMA Auth Failed: Missing user data');
    res.json(400, { error: 'Invalid user data' });
    return;
  }

  const token = generateSupabaseJWT(user.id);

  // Ensure farmer row exists
  try {
    const farmer = await dbService.getFarmerByTelegramId(user.id.toString());
    if (!farmer) {
      await dbService.registerFarmer(user.id.toString(), user.first_name || 'Farmer');
      logger.info('New farmer registered via TMA', { ctx: 'farmer:' + user.id });
    }
  } catch (dbErr) {
    logger.error('Failed to upsert farmer via TMA', { error: dbErr.message });
  }

  logger.info('TMA Auth Success', { ctx: 'farmer:' + user.id });
  res.json(200, { token, user: buildUserResponse(user) });
}

/**
 * POST /api/auth/telegram-oauth
 * Telegram Login Widget (browser OAuth) authentication.
 */
export async function loginWithTelegramOAuth(req, res) {
  const { oauthData } = req.body || {};

  if (!validateTelegramOAuthData(oauthData)) {
    logger.warn('Telegram OAuth Validation Failed');
    res.json(401, { error: 'Invalid Telegram OAuth data' });
    return;
  }

  if (!oauthData.id) {
    res.json(400, { error: 'Invalid user data' });
    return;
  }

  const token = generateSupabaseJWT(oauthData.id);

  // Ensure farmer row exists
  try {
    const farmer = await dbService.getFarmerByTelegramId(oauthData.id.toString());
    if (!farmer) {
      await dbService.registerFarmer(oauthData.id.toString(), oauthData.first_name || 'Farmer');
      logger.info('New farmer registered via OAuth', { ctx: 'farmer:' + oauthData.id });
    }
  } catch (dbErr) {
    logger.error('Failed to register farmer via OAuth', { error: dbErr.message });
  }

  logger.info('Telegram OAuth Auth Success', { ctx: 'farmer:' + oauthData.id });
  res.json(200, {
    token,
    user: buildUserResponse({
      id: oauthData.id,
      first_name: oauthData.first_name || '',
      language_code: oauthData.language_code || 'bn',
    }),
  });
}

/**
 * POST /api/auth/link-telegram
 * Links a Telegram account to an existing email/password account.
 * Requires a valid Bearer token (email user must already be logged in).
 */
export async function linkTelegramAccount(req, res) {
  const { oauthData } = req.body || {};

  // req.user is set by requireAuth middleware
  const authUserId = req.user?.sub;
  if (!authUserId) {
    res.json(401, { error: 'Unauthorized' });
    return;
  }

  if (!validateTelegramOAuthData(oauthData)) {
    logger.warn('Link Telegram: OAuth validation failed', { farmer: 'id:' + authUserId });
    res.json(401, { error: 'Invalid Telegram OAuth data' });
    return;
  }

  const telegramId = oauthData.id?.toString();
  if (!telegramId) {
    res.json(400, { error: 'Missing Telegram user id' });
    return;
  }

  try {
    // Check that this Telegram ID is not already linked to another account
    const existingFarmerByTelegram = await dbService.getFarmerByTelegramId(telegramId);
    if (existingFarmerByTelegram && existingFarmerByTelegram.auth_user_id !== authUserId) {
      res.json(409, {
        error:
          'এই টেলিগ্রাম অ্যাকাউন্টটি ইতিমধ্যে অন্য একটি অ্যাকাউন্টের সাথে যুক্ত। (Telegram account already linked to another account.)',
      });
      return;
    }

    // Link: set telegram_id on the farmer row identified by auth_user_id
    const success = await dbService.linkTelegramToAuthUser(authUserId, telegramId, {
      first_name: oauthData.first_name || '',
    });

    if (!success) {
      res.json(500, { error: 'Failed to link Telegram account. Please try again.' });
      return;
    }

    logger.info('Telegram account linked', {
      farmer: 'id:' + authUserId,
      ctx: 'farmer:' + telegramId,
    });

    res.json(200, {
      message: 'টেলিগ্রাম অ্যাকাউন্ট সফলভাবে যুক্ত হয়েছে। (Telegram account linked successfully.)',
      telegram_id: telegramId,
    });
  } catch (error) {
    logger.error('Link Telegram error', { error: error.message });
    res.json(500, { error: 'Internal server error' });
  }
}
