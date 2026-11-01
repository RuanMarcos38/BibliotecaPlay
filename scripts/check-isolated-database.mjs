import { randomUUID } from 'node:crypto';
import { db } from '../src/lib/db.ts';

// Diagnostic writes are always rolled back; no customer or CRM rows are read.
const id = `diagnostic-${randomUUID()}`;
try {
  const [identity] = await db.$queryRaw`select current_user::text as role, current_schema()::text as schema`;
  if (identity.role !== 'bibliotecaplay_runtime' || identity.schema !== 'bibliotecaplay') throw new Error('Unexpected database identity');
  let rolledBack = false;
  try {
    await db.$transaction(async transaction => {
      await transaction.category.create({ data: { id, name: id, slug: id } });
      await transaction.category.update({ where: { id }, data: { name: `${id}-updated` } });
      const row = await transaction.category.findUnique({ where: { id } });
      if (row?.name !== `${id}-updated`) throw new Error('Runtime CRUD failed');
      throw new Error('DiagnosticRollback');
    });
  } catch (error) {
    if (error.message !== 'DiagnosticRollback') throw error;
    rolledBack = true;
  }
  if (!rolledBack || await db.category.count({ where: { id } }) !== 0) throw new Error('Diagnostic rollback failed');
  let blocked = false;
  try { await db.$queryRawUnsafe('SELECT 1 FROM public.contacts LIMIT 0'); }
  catch (error) { blocked = String(error.message).includes('permission denied'); }
  if (!blocked) throw new Error('CRM isolation was not verified');
  console.log(JSON.stringify({ databaseConnected: true, dedicatedRole: true, categoryReadWrite: true, diagnosticRolledBack: true, crmAccessBlocked: true, tlsCertificateVerified: true }));
} catch (error) {
  console.error(JSON.stringify({ databaseTestPassed: false, kind: error.name, code: error.code ?? error.errorCode ?? null }));
  process.exitCode = 1;
} finally { await db.$disconnect(); }
