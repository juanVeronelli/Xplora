/**
 * Registro central de rutas `/api/*`.
 *
 * Orden conceptual: **salud** → **catálogo público** (anon) → **auth** → **admin CRUD** (JWT) → **upload**.
 * Los handlers de admin reciben el JWT ya validado por `requireAuth`.
 */
import type { Express } from 'express';
import rateLimit from 'express-rate-limit';
import type { AppConfig } from '../../config/env.js';
import type { IAuthService } from '../../services/contracts/auth.interface.js';
import type { IImageStorageService } from '../../services/contracts/image-storage.interface.js';
import { createHealthHandler } from '../controllers/health.controller.js';
import { createUploadHandler } from '../controllers/upload.controller.js';
import { createLoginHandler, createLogoutHandler } from '../controllers/auth-login.controller.js';
import {
  createPublicListHandler,
  createPublicSiteMediaHandler,
} from '../controllers/public-catalog.controller.js';
import { createPublicSubscribeHandler } from '../controllers/public-subscribe.controller.js';
import { createPublicCandidatosHandler } from '../controllers/public-candidatos.controller.js';
import { createPublicSponsorsLeadHandler } from '../controllers/public-sponsors.controller.js';
import { uploadSingleCv } from '../middleware/upload.middleware.js';
import {
  createAdminInsertHandler,
  createAdminUpdateHandler,
  createAdminDeleteHandler,
} from '../controllers/admin-resources.controller.js';
import {
  createAdminMembersListHandler,
  createAdminMemberDeleteHandler,
} from '../controllers/admin-members.controller.js';
import {
  createAdminDbExportUsuariosHandler,
  createAdminDbImportUsuariosCsvHandler,
  createAdminDbSqlSelectHandler,
} from '../controllers/admin-db-tools.controller.js';
import {
  createEmailCampaignInsertHandler,
  createEmailCampaignsListHandler,
  createEmailCampaignLogEnviosHandler,
  createEmailCampaignAudienceHandler,
} from '../controllers/admin-email-campaigns.controller.js';
import { createSiteMediaUpsertHandler } from '../controllers/site-media-admin.controller.js';
import { createRequireAuthMiddleware } from '../middleware/require-auth.middleware.js';
import { uploadSingleImage, uploadSingleCsv, uploadSingleSpreadsheet } from '../middleware/upload.middleware.js';
import { createAdminLumaCsvImportHandler } from '../controllers/admin-luma-csv.controller.js';
import { createAdminEventosListHandler } from '../controllers/admin-eventos-list.controller.js';
import { createAdminEventoInscripcionesHandler } from '../controllers/admin-evento-inscripciones.controller.js';
import { createAdminAnalyticsHandler } from '../controllers/admin-analytics.controller.js';
import { createAdminCandidatosDeleteHandler, createAdminCandidatosListHandler } from '../controllers/admin-candidatos.controller.js';
import { createAdminSponsorsLeadListHandler } from '../controllers/admin-sponsors.controller.js';
import {
  createContactListCreateHandler,
  createContactListDeleteHandler,
  createContactListDetailHandler,
  createContactListPatchHandler,
  createContactListsListHandler,
  createMyContactListsListHandler,
} from '../controllers/admin-contact-lists.controller.js';
import { createAuthMeHandler } from '../controllers/auth-me.controller.js';
import { createAuthChangePasswordHandler } from '../controllers/auth-change-password.controller.js';
import {
  createAdminCrmStaffCreateHandler,
  createAdminCrmStaffDeleteHandler,
  createAdminCrmStaffListHandler,
  createAdminCrmStaffPatchHandler,
  createAdminCrmStaffResetPasswordHandler,
} from '../controllers/admin-crm-staff.controller.js';
import { createLoadStaffProfileMiddleware } from '../middleware/load-staff.middleware.js';
import { createRequireAnyCrmPermission } from '../middleware/require-crm-permission.middleware.js';
import type { CrmPermissionKey } from '../../permissions/crm-permissions.js';

export interface ApiRoutesDeps {
  config: AppConfig;
  auth: IAuthService;
  imageStorage: IImageStorageService | null;
}

/** Monta todas las rutas `/api/*`. */
export function registerApiRoutes(app: Express, deps: ApiRoutesDeps): void {
  const requireAuth = createRequireAuthMiddleware(deps.auth);
  const loadStaff = createLoadStaffProfileMiddleware(deps.config);
  const perm = (keys: readonly CrmPermissionKey[]) => createRequireAnyCrmPermission(keys);

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get('/api/health', createHealthHandler(deps.config));

  const subscribeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
  });

  // ── Público (lecturas para el sitio; anon Supabase) ─────────────────────
  app.post('/api/public/subscribe', subscribeLimiter, createPublicSubscribeHandler(deps.config));
  app.post('/api/public/candidatos', subscribeLimiter, uploadSingleCv, createPublicCandidatosHandler(deps.config));
  app.post('/api/public/sponsors', subscribeLimiter, createPublicSponsorsLeadHandler(deps.config));

  app.get('/api/public/eventos', createPublicListHandler(deps.config, 'eventos'));
  app.get('/api/public/charlas', createPublicListHandler(deps.config, 'charlas'));
  app.get('/api/public/empleos', createPublicListHandler(deps.config, 'empleos'));
  app.get('/api/public/site-media', createPublicSiteMediaHandler(deps.config));

  // ── Auth (login sin Bearer; logout valida sesión) ───────────────────────
  app.post('/api/auth/login', loginLimiter, createLoginHandler(deps.config));
  app.post('/api/auth/logout', requireAuth, createLogoutHandler());
  app.get('/api/auth/me', requireAuth, createAuthMeHandler(deps.config));
  app.post(
    '/api/auth/change-password',
    loginLimiter,
    requireAuth,
    loadStaff,
    createAuthChangePasswordHandler(deps.config),
  );

  // ── Permisos CRM (middleware compuesto: auth → staff → permiso concreto) ─
  const evCatalog = perm([
    'events_create',
    'events_edit_delete',
    'past_events_create',
    'past_events_edit_delete',
  ]);
  const eventsCreate = perm(['events_create']);
  const eventsMutate = perm(['events_edit_delete']);
  const pastCreate = perm(['past_events_create']);
  const pastMutate = perm(['past_events_edit_delete']);
  const empleosMutate = perm(['empleos_edit_delete']);
  const siteEdit = perm(['site_edit']);
  const campaigns = perm(['email_campaigns']);
  /** Listar campañas y registrar envíos: marketing o rol “solo envíos” (nuevo o legacy). */
  const campaignListOrLog = perm([
    'email_campaigns',
    'email_campaign_sends',
    'database_full',
    'database_campaign_sends_only',
  ]);
  const analyticsPerm = perm(['analytics']);
  const dbMembersList = perm([
    'database_full',
    'database_members_only',
    'database_campaign_sends_only',
    'database_event_audience_only',
  ]);
  const dbAudience = perm(['database_full', 'database_event_audience_only']);
  /** Audiencia de una campaña (mails): marketing o rol de envíos. */
  const emailCampaignAudience = perm([
    'email_campaigns',
    'email_campaign_sends',
    'database_full',
    'database_campaign_sends_only',
  ]);
  const memberDelete = perm(['members_data_delete']);
  const cloudUpload = perm([
    'site_edit',
    'events_edit_delete',
    'past_events_edit_delete',
    'empleos_edit_delete',
  ]);
  const staffManage = perm(['staff_accounts_manage', 'access_total']);
  const candidatosManage = perm(['candidatos_manage', 'access_total']);
  const contactLists = perm(['database_full', 'contact_lists_manage']);
  const dbExport = perm(['database_full', 'database_export']);
  const dbImport = perm(['database_full', 'database_import']);
  const dbSqlRead = perm(['database_full', 'database_sql_read']);

  // ── Admin CRUD (JWT del usuario; respeta RLS) ──────────────────────────
  app.get('/api/admin/eventos', requireAuth, loadStaff, evCatalog, createAdminEventosListHandler(deps.config));
  app.get(
    '/api/admin/eventos/:eventoId/inscripciones',
    requireAuth,
    loadStaff,
    dbAudience,
    createAdminEventoInscripcionesHandler(deps.config),
  );
  app.post('/api/admin/eventos', requireAuth, loadStaff, eventsCreate, createAdminInsertHandler(deps.config, 'eventos'));
  app.patch('/api/admin/eventos/:id', requireAuth, loadStaff, eventsMutate, createAdminUpdateHandler(deps.config, 'eventos'));
  app.delete('/api/admin/eventos/:id', requireAuth, loadStaff, eventsMutate, createAdminDeleteHandler(deps.config, 'eventos'));
  app.post(
    '/api/admin/eventos/:eventoId/luma-csv',
    requireAuth,
    loadStaff,
    eventsMutate,
    uploadSingleCsv,
    createAdminLumaCsvImportHandler(deps.config),
  );

  app.post('/api/admin/charlas', requireAuth, loadStaff, pastCreate, createAdminInsertHandler(deps.config, 'charlas'));
  app.patch('/api/admin/charlas/:id', requireAuth, loadStaff, pastMutate, createAdminUpdateHandler(deps.config, 'charlas'));
  app.delete('/api/admin/charlas/:id', requireAuth, loadStaff, pastMutate, createAdminDeleteHandler(deps.config, 'charlas'));

  app.post('/api/admin/empleos', requireAuth, loadStaff, empleosMutate, createAdminInsertHandler(deps.config, 'empleos'));
  app.patch('/api/admin/empleos/:id', requireAuth, loadStaff, empleosMutate, createAdminUpdateHandler(deps.config, 'empleos'));
  app.delete('/api/admin/empleos/:id', requireAuth, loadStaff, empleosMutate, createAdminDeleteHandler(deps.config, 'empleos'));

  app.put('/api/admin/site-media', requireAuth, loadStaff, siteEdit, createSiteMediaUpsertHandler(deps.config));

  app.get('/api/admin/analytics', requireAuth, loadStaff, analyticsPerm, createAdminAnalyticsHandler(deps.config));

  app.get('/api/admin/members', requireAuth, loadStaff, dbMembersList, createAdminMembersListHandler(deps.config));
  app.delete('/api/admin/members/:id', requireAuth, loadStaff, memberDelete, createAdminMemberDeleteHandler(deps.config));

  // ── Database tools (export / import / SQL select) ──────────────────────
  app.get(
    '/api/admin/db/export/usuarios',
    requireAuth,
    loadStaff,
    dbExport,
    createAdminDbExportUsuariosHandler(deps.config),
  );
  app.post(
    '/api/admin/db/import/usuarios-csv',
    requireAuth,
    loadStaff,
    dbImport,
    uploadSingleSpreadsheet,
    createAdminDbImportUsuariosCsvHandler(deps.config),
  );
  app.post(
    '/api/admin/db/sql/select',
    requireAuth,
    loadStaff,
    dbSqlRead,
    createAdminDbSqlSelectHandler(deps.config),
  );

  app.get('/api/admin/contact-lists', requireAuth, loadStaff, contactLists, createContactListsListHandler(deps.config));
  // Para campañas: selector de "mis listas" (audiencias guardadas).
  app.get(
    '/api/admin/contact-lists/mine',
    requireAuth,
    loadStaff,
    perm(['email_campaigns', 'email_campaign_sends', 'database_full', 'database_campaign_sends_only']),
    createMyContactListsListHandler(deps.config),
  );
  app.post('/api/admin/contact-lists', requireAuth, loadStaff, contactLists, createContactListCreateHandler(deps.config));
  app.get('/api/admin/contact-lists/:id', requireAuth, loadStaff, contactLists, createContactListDetailHandler(deps.config));
  app.patch('/api/admin/contact-lists/:id', requireAuth, loadStaff, contactLists, createContactListPatchHandler(deps.config));
  app.delete('/api/admin/contact-lists/:id', requireAuth, loadStaff, contactLists, createContactListDeleteHandler(deps.config));

  app.post('/api/admin/email-campaigns', requireAuth, loadStaff, campaigns, createEmailCampaignInsertHandler(deps.config));
  app.get('/api/admin/email-campaigns', requireAuth, loadStaff, campaignListOrLog, createEmailCampaignsListHandler(deps.config));
  app.post(
    '/api/admin/email-campaigns/:id/envios',
    requireAuth,
    loadStaff,
    campaignListOrLog,
    createEmailCampaignLogEnviosHandler(deps.config),
  );
  app.get(
    '/api/admin/email-campaigns/:id/audience',
    requireAuth,
    loadStaff,
    emailCampaignAudience,
    createEmailCampaignAudienceHandler(deps.config),
  );

  app.get('/api/admin/crm-staff', requireAuth, loadStaff, createAdminCrmStaffListHandler(deps.config));
  app.post('/api/admin/crm-staff', requireAuth, loadStaff, staffManage, createAdminCrmStaffCreateHandler(deps.config));
  app.patch('/api/admin/crm-staff/:id', requireAuth, loadStaff, createAdminCrmStaffPatchHandler(deps.config));
  app.delete('/api/admin/crm-staff/:id', requireAuth, loadStaff, staffManage, createAdminCrmStaffDeleteHandler(deps.config));
  app.post(
    '/api/admin/crm-staff/:id/reset-password',
    requireAuth,
    loadStaff,
    staffManage,
    createAdminCrmStaffResetPasswordHandler(deps.config),
  );

  app.get('/api/admin/candidatos', requireAuth, loadStaff, candidatosManage, createAdminCandidatosListHandler(deps.config));
  app.delete(
    '/api/admin/candidatos/:id',
    requireAuth,
    loadStaff,
    candidatosManage,
    createAdminCandidatosDeleteHandler(deps.config),
  );
  app.get('/api/admin/sponsors', requireAuth, loadStaff, candidatosManage, createAdminSponsorsLeadListHandler(deps.config));

  // ── Subida de imágenes (Cloudinary) ─────────────────────────────────────
  const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/cloudinary-upload', uploadLimiter);
  app.post(
    '/api/cloudinary-upload',
    requireAuth,
    loadStaff,
    cloudUpload,
    uploadSingleImage,
    createUploadHandler({
      config: deps.config,
      imageStorage: deps.imageStorage,
    }),
  );
}
