import type { RequestHandler } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { AppConfig } from '../../config/env.js';
import { BadRequestError } from '../errors/http-error.js';
import { asyncHandler } from '../middleware/async-handler.js';

export function createLoginHandler(config: AppConfig): RequestHandler {
  return asyncHandler(async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) {
      throw new BadRequestError('Email y contraseña son obligatorios.');
    }

    const anon = createClient(config.supabaseUrl, config.supabaseAnonKey);
    const { data, error } = await anon.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      res.status(401).json({ error: error?.message || 'Credenciales incorrectas.' });
      return;
    }

    const s = data.session;
    res.json({
      session: {
        access_token: s.access_token,
        refresh_token: s.refresh_token,
        expires_in: s.expires_in,
        expires_at: s.expires_at,
        token_type: s.token_type,
      },
      user: data.user,
    });
  });
}

export function createLogoutHandler(): RequestHandler {
  return (_req, res) => {
    res.status(204).send();
  };
}
