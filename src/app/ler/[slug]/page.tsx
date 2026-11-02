import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { activeAccess } from "@/lib/access";
import { db } from "@/lib/db";
import Progress from "./progress";

export default async function Reader({ params }: { params: Promise<{ slug: string }> }) {
  const session = await activeAccess();
  if (!session) redirect("/entrar");
  const { slug } = await params;
  const book = await db.ebook.findUnique({ where: { slug }, include: { videos: { orderBy: { createdAt: "asc" } } } });
  if (!book || book.status !== "PUBLISHED" || !book.fileKey) notFound();
  const progress = await db.readingProgress.findUnique({ where: { userId_ebookId: { userId: session.id, ebookId: book.id } } });
  return <main className="detail"><Link href="/minha-biblioteca">Minha biblioteca</Link><h1>{book.title}</h1>
    <p>Última página salva: {progress?.page ?? 1}. O visualizador do navegador oferece os controles disponíveis neste dispositivo.</p>
    <iframe title={"Leitura de " + book.title} src={"/api/ebooks/" + book.id + "/read#page=" + (progress?.page ?? 1)} style={{ width: "100%", height: "75vh", border: 0 }} />
    <p><a href={"/api/ebooks/" + book.id + "/read"} target="_blank" rel="noreferrer">Abrir leitor em outra aba</a></p>
    <Progress ebookId={book.id} initialPage={progress?.page ?? 1} />
    {book.videos.map(video => <section key={video.id}><h2>{video.title}</h2><video controls preload="none" playsInline src={"/api/videos/" + video.id + "/play"} style={{ width: "100%" }} /></section>)}
  </main>;
}
