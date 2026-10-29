import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
const cookieName = "bp_session";
function secret() {
 const value = process.env.SESSION_SECRET;
 if (!value || value.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
 return new TextEncoder().encode(value);
}
export async function createSession(user: {id:string;role:string}) {
 const token = await new SignJWT({role:user.role}).setProtectedHeader({alg:"HS256"}).setSubject(user.id).setIssuedAt().setExpirationTime("7d").sign(secret());
 (await cookies()).set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:604800});
}
export async function getSession() {
 const token=(await cookies()).get(cookieName)?.value;
 if (!token) return null;
 try {const {payload}=await jwtVerify(token,secret()); return {id:payload.sub as string,role:payload.role as string};}
 catch{return null;}
}
export async function clearSession(){(await cookies()).delete(cookieName);}
export async function requireAdmin(){const s=await getSession();return s?.role==="ADMIN" ? s : null;}
