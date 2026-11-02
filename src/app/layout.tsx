import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"BibliotecaPlay | E-books por assinatura",description:"Explore e-books organizados por categorias. Assinatura de R$ 9,90 por mês.",robots:{index:true,follow:true}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>;}
