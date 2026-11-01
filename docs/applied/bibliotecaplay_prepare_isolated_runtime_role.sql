-- Audit copy of the applied migration; credentials are never recorded here.
-- Initial NOLOGIN role was enabled separately after provisioning a unique credential.
CREATE ROLE bibliotecaplay_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
ALTER ROLE bibliotecaplay_runtime SET search_path = bibliotecaplay, pg_catalog;
GRANT USAGE ON SCHEMA bibliotecaplay TO bibliotecaplay_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE bibliotecaplay."User" TO bibliotecaplay_runtime;
CREATE POLICY bp_server_runtime ON bibliotecaplay."User" FOR ALL TO bibliotecaplay_runtime USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE bibliotecaplay."Category" TO bibliotecaplay_runtime;
CREATE POLICY bp_server_runtime ON bibliotecaplay."Category" FOR ALL TO bibliotecaplay_runtime USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE bibliotecaplay."Ebook" TO bibliotecaplay_runtime;
CREATE POLICY bp_server_runtime ON bibliotecaplay."Ebook" FOR ALL TO bibliotecaplay_runtime USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE bibliotecaplay."Video" TO bibliotecaplay_runtime;
CREATE POLICY bp_server_runtime ON bibliotecaplay."Video" FOR ALL TO bibliotecaplay_runtime USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE bibliotecaplay."Subscription" TO bibliotecaplay_runtime;
CREATE POLICY bp_server_runtime ON bibliotecaplay."Subscription" FOR ALL TO bibliotecaplay_runtime USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE bibliotecaplay."ReadingProgress" TO bibliotecaplay_runtime;
CREATE POLICY bp_server_runtime ON bibliotecaplay."ReadingProgress" FOR ALL TO bibliotecaplay_runtime USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE bibliotecaplay."PaymentEvent" TO bibliotecaplay_runtime;
CREATE POLICY bp_server_runtime ON bibliotecaplay."PaymentEvent" FOR ALL TO bibliotecaplay_runtime USING (true) WITH CHECK (true);
