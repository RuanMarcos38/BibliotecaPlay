import { randomUUID, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import bcrypt from 'bcryptjs';
import { db } from '../src/lib/db.ts';

// Explicit diagnostic fixtures only. This validates access control, not billing.
const base = process.env.DIAGNOSTIC_BASE_URL || 'http://127.0.0.1:3102';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Run diagnostics only against the local server');
const run = `diagnostic-${randomUUID()}`;
const adminEmail = `${run}-admin@bibliotecaplay.invalid`;
const memberEmail = `${run}-member@bibliotecaplay.invalid`;
const password = randomBytes(30).toString('base64url');
const keys = [];
const results = [];
let categoryId;
const s3 = new S3Client({ endpoint: process.env.STORAGE_ENDPOINT, region: process.env.STORAGE_REGION, forcePathStyle: true,
  credentials: { accessKeyId: process.env.STORAGE_ACCESS_KEY_ID, secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY } });
if (process.env.STORAGE_BUCKET !== 'bibliotecaplay-private') throw new Error('Unexpected storage bucket');
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('next/package.json'))('sharp');

function expect(value, label) { if (!value) throw new Error(label); results.push(label); }
async function request(path, { method = 'GET', cookie, body, expected = 200, redirect = 'follow' } = {}) {
  const response = await fetch(base + path, { method, redirect,
    headers: { Origin: base, ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined });
  if (response.status !== expected) throw new Error(`${method} ${path} returned ${response.status}, expected ${expected}`);
  return response;
}
async function login(email) {
  const response = await request('/api/auth/login', { method: 'POST', body: { email, password } });
  const header = response.headers.get('set-cookie');
  expect(header?.includes('HttpOnly') && header.includes('SameSite=lax'), 'session_cookie_protected');
  return header.split(';')[0];
}
async function upload(kind, mime, bytes, cookie) {
  const response = await request('/api/admin/upload-url', { method: 'POST', cookie,
    body: { kind, mime, size: bytes.length, fileName: 'diagnostic-fixture' } });
  const { key, url } = await response.json();
  keys.push(key);
  const sent = await fetch(url, { method: 'PUT', headers: { 'Content-Type': mime }, body: bytes });
  expect(sent.ok, `${kind}_uploaded`);
  return key;
}
function pdfFixture() {
  const stream = 'BT /F1 12 Tf 30 100 Td (BibliotecaPlay - temporary diagnostic fixture) Tj ET';
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];
  let pdf = '%PDF-1.4\n'; const offsets = [];
  for (let index = 0; index < objects.length; index++) { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`; }
  const xref = Buffer.byteLength(pdf);
  return Buffer.from(pdf + `xref\n0 6\n0000000000 65535 f \n${offsets.map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
}

try {
  await db.user.create({ data: { name: run, email: adminEmail, passwordHash: await bcrypt.hash(password, 12), role: 'ADMIN' } });
  const admin = await login(adminEmail);
  await request('/api/auth/register', { method: 'POST', expected: 201, body: { name: run, email: memberEmail, password, role: 'ADMIN' } });
  const memberRecord = await db.user.findUnique({ where: { email: memberEmail } });
  expect(memberRecord.role === 'SUBSCRIBER', 'public_signup_cannot_elevate_role');
  const member = await login(memberEmail);
  await request('/api/admin/catalog', { cookie: member, expected: 403 });
  results.push('member_admin_access_blocked');
  const category = await (await request('/api/admin/categories', { method: 'POST', cookie: admin, expected: 201, body: { name: run, slug: run } })).json();
  categoryId = category.id;
  const book = await (await request('/api/admin/ebooks', { method: 'POST', cookie: admin, expected: 201,
    body: { title: run, slug: run, author: 'Temporary diagnostic fixture', description: 'Temporary automated diagnostic fixture, removed after verification.', categoryId } })).json();
  await request(`/api/admin/ebooks/${book.id}`, { method: 'PATCH', cookie: admin, body: { status: 'PUBLISHED' }, expected: 400 });
  results.push('publication_requires_pdf_and_cover');
  const pdf = pdfFixture();
  const fileKey = await upload('ebook', 'application/pdf', pdf, admin);
  const cover = await sharp({ create: { width: 60, height: 90, channels: 3, background: { r: 40, g: 40, b: 40 } } }).webp().toBuffer();
  const coverKey = await upload('cover', 'image/webp', cover, admin);
  await request(`/api/admin/ebooks/${book.id}`, { method: 'PATCH', cookie: admin, body: { fileKey, coverKey, status: 'PUBLISHED' } });
  const catalog = await (await request(`/?q=${encodeURIComponent(run)}`)).text();
  expect(catalog.includes(run), 'published_book_appears_in_search');
  const image = await request('/api/' + coverKey);
  expect(Buffer.from(await image.arrayBuffer()).equals(cover), 'published_cover_readable');
  await request(`/api/ebooks/${book.id}/read`, { cookie: member, expected: 403 });
  results.push('unpaid_member_pdf_blocked');
  // A temporary database fixture tests authorization only; no gateway/payment is simulated as real.
  await db.subscription.create({ data: { userId: memberRecord.id, status: 'ACTIVE', paidThrough: new Date(Date.now() + 3600000) } });
  const document = await request(`/api/ebooks/${book.id}/read`, { cookie: member });
  expect(Buffer.from(await document.arrayBuffer()).equals(pdf), 'active_access_pdf_download_integrity');
  await request(`/api/ebooks/${book.id}/progress`, { method: 'POST', cookie: member, body: { page: 1 } });
  const progress = await db.readingProgress.findUnique({ where: { userId_ebookId: { userId: memberRecord.id, ebookId: book.id } } });
  expect(progress?.page === 1, 'reading_progress_persisted');
  const reader = await (await request('/ler/' + run, { cookie: member })).text();
  expect(reader.includes(run) && reader.includes('/read#page='), 'reader_resumes_saved_page');
  await db.subscription.updateMany({ where: { userId: memberRecord.id }, data: { paidThrough: new Date(Date.now() - 60000) } });
  await request(`/api/ebooks/${book.id}/read`, { cookie: member, expected: 403 });
  results.push('expired_access_pdf_blocked');
  const logout = await request('/api/auth/logout', { method: 'POST', cookie: member });
  expect(/Max-Age=0|Expires=[^;]*1970/i.test(logout.headers.get('set-cookie') || ''), 'logout_clears_cookie');
  console.log(JSON.stringify({ coreFlowPassed: true, assertions: results, billingValidated: false, videoPlaybackValidated: false }));
} catch (error) {
  let message = String(error.message);
  for (const secret of [password, process.env.DATABASE_URL, process.env.STORAGE_SECRET_ACCESS_KEY, process.env.SESSION_SECRET]) if (secret) message = message.replaceAll(secret, '[redacted]');
  console.error(JSON.stringify({ coreFlowPassed: false, completed: results, error: message.slice(0, 600) }));
  process.exitCode = 1;
} finally {
  try {
    const book = await db.ebook.findUnique({ where: { slug: run } });
    if (book) { await db.readingProgress.deleteMany({ where: { ebookId: book.id } }); await db.video.deleteMany({ where: { ebookId: book.id } }); await db.ebook.delete({ where: { id: book.id } }); }
    if (categoryId) await db.category.delete({ where: { id: categoryId } });
    const users = await db.user.findMany({ where: { email: { in: [adminEmail, memberEmail] } }, select: { id: true } });
    const ids = users.map(user => user.id);
    await db.readingProgress.deleteMany({ where: { userId: { in: ids } } });
    await db.subscription.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
    for (const key of keys) await s3.send(new DeleteObjectCommand({ Bucket: 'bibliotecaplay-private', Key: key }));
    console.log(JSON.stringify({ diagnosticFixturesRemoved: true }));
  } catch { console.error(JSON.stringify({ diagnosticFixturesRemoved: false, diagnosticRun: run })); process.exitCode = 1; }
  await db.$disconnect(); s3.destroy();
}
