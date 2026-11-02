-- Applied through the authorized Supabase connector on 2026-10-29.
-- This is an audit copy, not an automatic Prisma migration.
-- The application uses its own User and session model. Do not grant browser API access.
ALTER TABLE bibliotecaplay."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE bibliotecaplay."Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE bibliotecaplay."Ebook" ENABLE ROW LEVEL SECURITY;
ALTER TABLE bibliotecaplay."Video" ENABLE ROW LEVEL SECURITY;
ALTER TABLE bibliotecaplay."Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE bibliotecaplay."ReadingProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE bibliotecaplay."PaymentEvent" ENABLE ROW LEVEL SECURITY;
