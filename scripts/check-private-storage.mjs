import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

// Runs only against the authorized BibliotecaPlay bucket; never logs credentials or signed URLs.
const endpoint = 'https://iqrnytsgwaiegddfxfjs.storage.supabase.co/storage/v1/s3';
const bucket = 'bibliotecaplay-private';
if (process.env.STORAGE_ENDPOINT !== endpoint || process.env.STORAGE_BUCKET !== bucket) {
  throw new Error('Configure the authorized BibliotecaPlay endpoint and bucket first');
}
if (!process.env.STORAGE_ACCESS_KEY_ID || !process.env.STORAGE_SECRET_ACCESS_KEY) throw new Error('Server storage credentials required');
const client = new S3Client({ endpoint, region: 'us-west-2', forcePathStyle: true,
  credentials: { accessKeyId: process.env.STORAGE_ACCESS_KEY_ID, secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY } });
const key = `diagnostics/${randomUUID()}.pdf`;
const stream = 'BT /F1 12 Tf 30 100 Td (BibliotecaPlay - storage diagnostic only) Tj ET';
const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
];
let pdf = '%PDF-1.4\n';
const offsets = [0];
for (let i = 0; i < objects.length; i++) {
  offsets.push(Buffer.byteLength(pdf));
  pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
}
const xref = Buffer.byteLength(pdf);
pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
const content = Buffer.from(pdf);
let uploaded = false;
try {
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: content, ContentType: 'application/pdf' }));
  uploaded = true;
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  if (head.ContentLength !== content.length || head.ContentType !== 'application/pdf') throw new Error('MetadataMismatch');
  const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 60 });
  const download = await fetch(url);
  if (!download.ok || !Buffer.from(await download.arrayBuffer()).equals(content)) throw new Error('SignedDownloadMismatch');
  const publicResponse = await fetch(`https://iqrnytsgwaiegddfxfjs.supabase.co/storage/v1/object/public/${bucket}/${key}`);
  if (publicResponse.ok) throw new Error('UnexpectedPublicAccess');
  console.log(JSON.stringify({ upload: true, metadata: true, signedDownload: true, publicAccessBlocked: true }));
} catch (error) {
  console.error(JSON.stringify({ storageTestPassed: false, errorType: error.name }));
  process.exitCode = 1;
} finally {
  if (uploaded) {
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      console.log(JSON.stringify({ diagnosticFileRemoved: true }));
    } catch { console.error(JSON.stringify({ diagnosticFileRemoved: false, key })); process.exitCode = 1; }
  }
  client.destroy();
}
