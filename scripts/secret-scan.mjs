#!/usr/bin/env node
// Hook PreToolUse — bloque un `git add/commit/push` qui embarquerait un secret.
//
// Inspiré du garde-fou "secret-scan" du toolkit La Recette (Minos, minosdevs.app),
// réécrit pour ce projet (Firebase/Firestore + GitHub Pages, pas Supabase).
//
// Protocole hook Claude Code : ce script reçoit un JSON sur STDIN (tool_input.command,
// cwd). Pour bloquer, il écrit sur STDOUT { hookSpecificOutput: { permissionDecision: "deny", ... } }
// et exit 0. Pour laisser passer : exit 0 sans rien écrire.
// Fail-open sur toute erreur interne ou si Node est absent (voir .claude/settings.json) —
// un garde-fou cassé ne doit jamais bloquer un commit légitime.

import { spawnSync } from 'node:child_process';
import { readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const MAX_FILE_BYTES = 400 * 1024;
const MAX_FILES = 500;

const SKIP_DIR = new Set(['node_modules', '.git', '.expo', 'dist', 'web-build', 'docs', 'ios', 'android']);
const SKIP_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.zip', '.gz',
  '.mp4', '.mov', '.mp3', '.woff', '.woff2', '.ttf', '.otf', '.lock',
]);

// La clé web Firebase (AIzaSy...) est publique par design (cf. src/firebase/config.ts) :
// la vraie sécurité vient des règles Firestore, pas du secret de cette clé. On ne la flague pas.
const PLACEHOLDERS = ['your', 'example', 'changeme', 'change-me', 'placeholder', 'xxxx', 'process.env', '${', '<', 'undefined', 'sample', 'todo', 'replace'];

function looksPlaceholder(v) {
  const low = v.toLowerCase();
  if (PLACEHOLDERS.some((p) => low.includes(p))) return true;
  if (/^(.)\1+$/.test(v)) return true;
  return false;
}

function matchAll(line, re) {
  const out = [];
  const rx = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m;
  while ((m = rx.exec(line)) !== null) out.push(m[0]);
  return out;
}

const ROTATE = {
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
  github: 'https://github.com/settings/tokens',
  aws: 'https://console.aws.amazon.com/iam/home#/security_credentials',
  stripe: 'https://dashboard.stripe.com/apikeys',
  slack: 'https://api.slack.com/apps',
  firebase: 'https://console.firebase.google.com/project/defi-99/settings/serviceaccounts/adminsdk',
  generic: null,
};

const DETECTORS = [
  { id: 'openai', label: 'Clé OpenAI (sk-...)', provider: 'openai', test: (l) => matchAll(l, /\bsk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{20,}\b/) },
  { id: 'anthropic', label: 'Clé Anthropic (sk-ant-...)', provider: 'anthropic', test: (l) => matchAll(l, /\bsk-ant-[A-Za-z0-9_-]{20,}\b/) },
  { id: 'github', label: 'Token GitHub', provider: 'github', test: (l) => [
      ...matchAll(l, /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/),
      ...matchAll(l, /\bgithub_pat_[A-Za-z0-9_]{30,}\b/),
    ] },
  { id: 'aws', label: 'Clé AWS (AKIA...)', provider: 'aws', test: (l) => matchAll(l, /\bAKIA[0-9A-Z]{16}\b/) },
  { id: 'stripe', label: 'Clé Stripe live', provider: 'stripe', test: (l) => matchAll(l, /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/) },
  { id: 'slack', label: 'Token Slack (xox...)', provider: 'slack', test: (l) => matchAll(l, /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/) },
  { id: 'private_key', label: 'Clé privée (PEM / compte de service Firebase)', provider: 'firebase', test: (l) => matchAll(l, /-----BEGIN(?: RSA| EC| OPENSSH| DSA| PGP)? PRIVATE KEY-----/) },
  {
    id: 'generic_assignment', label: 'Secret dans une variable (TOKEN/SECRET/PASSWORD/API_KEY...)', provider: 'generic',
    test: (l) => {
      const rx = /(?:^|[^A-Za-z0-9_])([A-Z0-9_]*(?:SECRET|_TOKEN|TOKEN|PASSWORD|PRIVATE_KEY|API_KEY|ACCESS_KEY|SERVICE_ACCOUNT)[A-Z0-9_]*)\s*[:=]\s*["']?([^"'\s#]{12,})["']?/g;
      const out = [];
      let m;
      while ((m = rx.exec(l)) !== null) {
        if (/^AIzaSy/.test(m[2])) continue; // clé Firebase/Google web publique par design
        if (!looksPlaceholder(m[2])) out.push(m[2]);
      }
      return out;
    },
  },
];

function git(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return { ok: r.status === 0, out: (r.stdout || '').trim() };
}

function isRepo(cwd) {
  return git(cwd, ['rev-parse', '--is-inside-work-tree']).ok;
}

function repoRoot(cwd) {
  const r = git(cwd, ['rev-parse', '--show-toplevel']);
  return r.ok ? r.out : cwd;
}

function segments(cmd) {
  return cmd.split(/\r?\n|&&|\|\||;|\|/).map((s) => s.trim()).filter(Boolean);
}

function detectGitOps(cmd) {
  const ops = [];
  for (const seg of segments(cmd)) {
    const toks = seg.split(/\s+/);
    const gi = toks.findIndex((t) => t === 'git');
    if (gi === -1) continue;
    const sub = toks[gi + 1];
    if (!['add', 'commit', 'push'].includes(sub)) continue;
    ops.push({ sub, rest: toks.slice(gi + 2) });
  }
  return ops;
}

function porcelainChanged(cwd) {
  const r = git(cwd, ['status', '--porcelain', '--untracked-files=all']);
  if (!r.ok) return [];
  return r.out.split(/\r?\n/).filter(Boolean).map((l) => l.slice(3).replace(/^"|"$/g, ''));
}

function stagedFiles(cwd) {
  const r = git(cwd, ['diff', '--cached', '--name-only', '--diff-filter=ACM']);
  return r.ok && r.out ? r.out.split(/\r?\n/).filter(Boolean) : [];
}

function pushRangeFiles(cwd) {
  const up = git(cwd, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  if (up.ok && up.out) {
    const d = git(cwd, ['diff', '--name-only', `${up.out}..HEAD`]);
    if (d.ok && d.out) return d.out.split(/\r?\n/).filter(Boolean);
  }
  const all = git(cwd, ['ls-files']);
  return all.ok && all.out ? all.out.split(/\r?\n/).filter(Boolean) : [];
}

function collectCandidates(cwd, ops) {
  const set = new Set();
  const envFiles = new Set();
  for (const op of ops) {
    if (op.sub === 'add') {
      const targets = op.rest.filter((t) => !t.startsWith('-'));
      if (!targets.length || targets.some((t) => ['.', '-A', '--all', '-u'].includes(t))) {
        for (const f of porcelainChanged(cwd)) set.add(f);
      } else {
        for (const t of targets) set.add(t);
      }
    } else if (op.sub === 'commit') {
      for (const f of stagedFiles(cwd)) set.add(f);
    } else if (op.sub === 'push') {
      for (const f of pushRangeFiles(cwd)) set.add(f);
    }
  }
  for (const f of set) {
    const base = path.basename(f);
    if (/^\.env(\..+)?$/.test(base) && !/\.(example|sample|template)$/.test(base)) envFiles.add(f);
  }
  return { files: [...set].slice(0, MAX_FILES), envFiles: [...envFiles] };
}

function shouldSkip(rel) {
  if (rel.split('/').some((p) => SKIP_DIR.has(p))) return true;
  if (SKIP_EXT.has(path.extname(rel).toLowerCase())) return true;
  return false;
}

function mask(v) {
  return v.length <= 10 ? v[0] + '***' : v.slice(0, 4) + '…' + v.slice(-3);
}

function scanFile(root, rel, findings) {
  if (shouldSkip(rel)) return;
  const abs = path.join(root, rel);
  let st;
  try { st = statSync(abs); } catch { return; }
  if (!st.isFile() || st.size > MAX_FILE_BYTES) return;
  let buf;
  try { buf = readFileSync(abs); } catch { return; }
  if (buf.includes(0)) return;
  const lines = buf.toString('utf8').split(/\r?\n/);

  // Un fichier de compte de service Firebase entier (client_email + private_key) est
  // toujours un vrai secret, même sans mot-clé "SECRET/TOKEN" dans le nom des champs JSON.
  const text = lines.join('\n');
  if (/"type"\s*:\s*"service_account"/.test(text) && /"private_key"\s*:/.test(text)) {
    findings.push({ file: rel, line: 1, type: 'Fichier de compte de service Firebase (service_account JSON)', provider: 'firebase', value: 'fichier entier' });
    return;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    for (const det of DETECTORS) {
      let hits;
      try { hits = det.test(line); } catch { hits = []; }
      for (const raw of hits) {
        findings.push({ file: rel, line: i + 1, type: det.label, provider: det.provider, value: mask(String(raw)) });
      }
    }
  }
}

function buildReason(findings, unignoredEnv) {
  const uniq = [];
  const seen = new Set();
  for (const f of findings) {
    const k = `${f.file}|${f.type}|${f.value}`;
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(f);
  }

  const lines = [];
  lines.push('🛑 Commit/push bloqué avant de partir en ligne.');
  lines.push('');
  lines.push('Un secret (clé d\'API, token, mot de passe) est sur le point d\'entrer dans l\'historique Git.');
  lines.push('Une fois poussé sur GitHub, n\'importe qui peut le récupérer. On le retire avant, c\'est tout.');
  lines.push('');

  if (unignoredEnv.length) {
    lines.push('📄 Fichier(s) .env non ignoré(s) :');
    for (const f of unignoredEnv) lines.push(`   • ${f}`);
    lines.push('');
  }
  if (uniq.length) {
    lines.push('🔑 Secret(s) détecté(s) :');
    for (const f of uniq.slice(0, 25)) lines.push(`   • ${f.file}:${f.line} — ${f.type}  [${f.value}]`);
    lines.push('');
  }
  lines.push('Retire le secret du fichier (variable d\'environnement / .env ignoré par git), puis relance');
  lines.push('la commande — elle passera toute seule.');

  const providers = new Set(uniq.map((f) => f.provider).filter((p) => ROTATE[p]));
  if (providers.size) {
    lines.push('');
    lines.push('Si ce secret a déjà été poussé une fois, régénère-le ici :');
    for (const p of providers) lines.push(`   • ${p} : ${ROTATE[p]}`);
  }
  return lines.join('\n');
}

function allow() { process.exit(0); }
function deny(reason) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }));
  process.exit(0);
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(data));
    setTimeout(() => resolve(data), 4000).unref?.();
  });
}

async function main() {
  let payload;
  try { payload = JSON.parse(await readStdin()); } catch { return allow(); }

  const cmd = payload?.tool_input?.command;
  if (typeof cmd !== 'string' || !cmd.trim()) return allow();

  const ops = detectGitOps(cmd);
  if (!ops.length) return allow();

  const cwd = payload.cwd && existsSync(payload.cwd) ? payload.cwd : process.cwd();
  if (!isRepo(cwd)) return allow();
  const root = repoRoot(cwd);

  const { files, envFiles } = collectCandidates(cwd, ops);

  const unignoredEnv = [];
  for (const f of envFiles) {
    const chk = git(cwd, ['check-ignore', '-q', '--', f]);
    if (!chk.ok) unignoredEnv.push(f); // status non-nul via spawnSync => non ignoré
  }

  const findings = [];
  for (const rel of files) scanFile(root, rel, findings);

  if (!findings.length && !unignoredEnv.length) return allow();
  return deny(buildReason(findings, unignoredEnv));
}

main().catch(() => allow());
