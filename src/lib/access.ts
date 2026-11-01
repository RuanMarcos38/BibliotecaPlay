import {db} from "@/lib/db";
import {getSession} from "@/lib/session";
export async function activeAccess(){
 const s=await getSession();
 if(!s) return null;
 if(s.role==="ADMIN") return s;
 const sub=await db.subscription.findFirst({where:{userId:s.id,status:"ACTIVE",paidThrough:{gt:new Date()}}});
 return sub?s:null;
}
