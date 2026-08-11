import fs from 'node:fs';
import path from 'node:path';

const matrixPath = '/Users/choiseongmin/Documents/Codex/2026-08-05/files-mentioned-by-the-user-2026/store-submit-assets/future-32-metadata-20260809/app-matrix.json';
const metadataPath = '/Users/choiseongmin/Documents/Codex/2026-07-27/as/outputs/certification-metadata-unification-20260810-v4/FINAL_METADATA_TABLE.json';
const appsRoot = path.resolve(import.meta.dirname, '..', 'apps');

const pendingAppIds = [
  'databricks_data_engineer_associate_public',
  'isc2_sscp_2025_public',
  'istqb_ct_ai_v2_public',
  'istqb_ct_genai_v1_1_public',
  'istqb_ctal_tae_v2_public',
  'lpi_devops_tools_engineer_701_200_public',
  'lpi_security_essentials_020_100_public',
  'oracle_master_bronze_dba_26ai_1z0_185_jpn_public',
  'oracle_master_silver_dba_26ai_1z0_182_jpn_public',
  'oracle_master_silver_sql_26ai_1z0_171_jpn_public',
  'pmi_pmp_2026_public',
  'safe_scrum_master_public',
  'scrum_psm_ii_public',
  'scrum_pspo_i_public',
  'scrum_pspo_ii_public',
  'splunk_core_certified_user_public',
];

const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
const matrixById = new Map(matrix.apps.map((app) => [app.app_id, app]));

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const style = 'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:760px;margin:0 auto;padding:32px 20px;line-height:1.7;color:#172033}a{color:#1d4ed8}nav{display:flex;gap:16px;flex-wrap:wrap;margin:24px 0}small{color:#526078}';
const results = [];

for (const appId of pendingAppIds) {
  const app = matrixById.get(appId);
  if (!app) throw new Error(`Missing app-matrix row: ${appId}`);

  const authorityTargetId = appId.replace(/_public$/, '');
  const rows = metadata.rows.filter((row) => row.authorityTargetId === authorityTargetId || row.targetKey === authorityTargetId);
  const titleRow = rows.find((row) => row.locale === 'en-US') ?? rows.find((row) => row.locale === 'ja-JP') ?? rows[0];
  if (!titleRow?.name) throw new Error(`Missing locked metadata title: ${appId}`);

  const title = escapeHtml(titleRow.name);
  const directory = path.join(appsRoot, app.app_slug);
  fs.mkdirSync(directory, { recursive: true });

  const pages = {
    'index.html': `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${style}</style></head><body><h1>${title}</h1><nav><a href="./">App information</a><a href="privacy.html">Privacy policy</a><a href="support.html">Support</a></nav><p>Prepare with independently authored practice questions, 50-question sets, domain and difficulty study, detailed explanations, review tools, mock exams, key-term flashcards, and optional audio study.</p><p>This independent study app is not affiliated with, endorsed by, or sponsored by any certification provider or trademark owner.</p></body></html>\n`,
    'support.html': `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} Support</title><style>${style}</style></head><body><h1>${title}</h1><nav><a href="./">App information</a><a href="privacy.html">Privacy policy</a><a href="support.html">Support</a></nav><h2>Support</h2><p>Please include the app name, app version, device and OS version, and the screen where the issue occurred.</p><p><a href="mailto:storkan2@gmail.com">storkan2@gmail.com</a></p></body></html>\n`,
    'privacy.html': `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} Privacy Policy</title><style>${style}</style></head><body><h1>${title}</h1><nav><a href="./">App information</a><a href="privacy.html">Privacy policy</a><a href="support.html">Support</a></nav><h2>Privacy policy</h2><p>No account registration or advertising is provided. Detailed question progress, wrong answers, review notes, glossary recall, reminders, and theme settings are stored on the device.</p><p>To provide purchase and restore functions and maintain cross-session study metrics, Apple and RevenueCat may process purchase status, an app user identifier, total active study time, total questions answered, total correct answers, and the last study activity time. These values are not used for advertising or cross-app tracking, and individual question text or answer selections are not transmitted as study metrics.</p><p>For privacy questions, contact <a href="mailto:storkan2@gmail.com">storkan2@gmail.com</a>.</p><p><small>Effective: August 12, 2026</small></p></body></html>\n`,
  };

  const written = [];
  const preserved = [];
  for (const [fileName, contents] of Object.entries(pages)) {
    const destination = path.join(directory, fileName);
    if (fs.existsSync(destination)) {
      preserved.push(fileName);
      continue;
    }
    fs.writeFileSync(destination, contents, 'utf8');
    written.push(fileName);
  }

  results.push({ appId, appSlug: app.app_slug, title: titleRow.name, written, preserved });
}

process.stdout.write(`${JSON.stringify({ status: 'GENERATED_MISSING_ONLY', count: results.length, results }, null, 2)}\n`);
