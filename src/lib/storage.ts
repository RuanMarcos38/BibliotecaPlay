import {S3Client,PutObjectCommand,GetObjectCommand,HeadObjectCommand} from "@aws-sdk/client-s3";import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
function cfg(){const {STORAGE_ENDPOINT,STORAGE_REGION,STORAGE_BUCKET,STORAGE_ACCESS_KEY_ID,STORAGE_SECRET_ACCESS_KEY}=process.env;if(!STORAGE_ENDPOINT||!STORAGE_REGION||!STORAGE_BUCKET||!STORAGE_ACCESS_KEY_ID||!STORAGE_SECRET_ACCESS_KEY)throw new Error("Storage privado não configurado");return {bucket:STORAGE_BUCKET,client:new S3Client({region:STORAGE_REGION,endpoint:STORAGE_ENDPOINT,forcePathStyle:true,credentials:{accessKeyId:STORAGE_ACCESS_KEY_ID,secretAccessKey:STORAGE_SECRET_ACCESS_KEY}})};}
export async function uploadUrl(key:string,mime:string){const {bucket,client}=cfg();return getSignedUrl(client,new PutObjectCommand({Bucket:bucket,Key:key,ContentType:mime}),{expiresIn:300});}
export async function readingUrl(key:string){const {bucket,client}=cfg();return getSignedUrl(client,new GetObjectCommand({Bucket:bucket,Key:key,ResponseContentDisposition:"inline"}),{expiresIn:120});}
export async function verifyStoredFile(key:string,kind:"ebook"|"cover"|"video") {
 const {bucket,client}=cfg();
 const spec={ebook:{prefix:"ebooks/",mime:"application/pdf",max:50*1024*1024},cover:{prefix:"covers/",mime:"image/webp",max:5*1024*1024},video:{prefix:"videos/",mime:"video/mp4",max:500*1024*1024}}[kind];
 if(!key.startsWith(spec.prefix))throw new Error("Invalid file key");
 const metadata=await client.send(new HeadObjectCommand({Bucket:bucket,Key:key}));
 if(!metadata.ContentLength||metadata.ContentLength>spec.max||metadata.ContentType!==spec.mime)throw new Error("Invalid file metadata");
 const object=await client.send(new GetObjectCommand({Bucket:bucket,Key:key,Range:"bytes=0-15"}));
 const bytes=await object.Body?.transformToByteArray();
 if(!bytes)throw new Error("Empty file");
 const text=new TextDecoder().decode(bytes);
 const valid=kind==="ebook"?text.startsWith("%PDF-"):kind==="cover"?text.startsWith("RIFF")&&text.slice(8,12)==="WEBP":text.slice(4,8)==="ftyp";
 if(!valid)throw new Error("File signature does not match type");
}
