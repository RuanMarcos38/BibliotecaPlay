import { test } from "node:test";
import assert from "node:assert/strict";
import { allowedMutation } from "../src/lib/request-security.mjs";

test("rejects cross-origin writes even when a session cookie exists", () => {
  const request = new Request("https://biblioteca.example/api/admin/categories", {
    method: "POST", headers: { origin: "https://attacker.example", cookie: "bp_session=value" },
  });
  assert.equal(allowedMutation(request), false);
});
test("rejects missing, malformed and cross-site origins", () => {
  for (const headers of [{}, { origin: "null" }, { origin: "broken" }, { origin: "https://biblioteca.example", "sec-fetch-site": "cross-site" }]) {
    assert.equal(allowedMutation(new Request("https://biblioteca.example/api/auth/logout", { method: "POST", headers })), false);
  }
});
test("allows same-origin application writes and public reads", () => {
  assert.equal(allowedMutation(new Request("https://biblioteca.example/api/auth/login", { method: "POST", headers: { origin: "https://biblioteca.example" } })), true);
  assert.equal(allowedMutation(new Request("https://biblioteca.example/api/health")), true);
});

test("accepts the real browser Host when Next normalizes its internal URL", () => {
  assert.equal(allowedMutation(new Request("http://localhost:3102/api/auth/login", {
    method: "POST", headers: { host: "127.0.0.1:3102", origin: "http://127.0.0.1:3102" },
  })), true);
});
test("supports HTTPS at the reverse proxy without trusting a forwarded host", () => {
  const headers = { host: "biblioteca.example", origin: "https://biblioteca.example", "x-forwarded-proto": "https" };
  assert.equal(allowedMutation(new Request("http://localhost:3000/api/auth/login", { method: "POST", headers })), true);
  assert.equal(allowedMutation(new Request("http://localhost:3000/api/auth/login", {
    method: "POST", headers: { ...headers, origin: "https://attacker.example", "x-forwarded-host": "attacker.example" },
  })), false);
});
test("rejects malformed authorities and non-origin strings", () => {
  for (const extra of [{ host: "user@biblioteca.example" }, { origin: "https://biblioteca.example/path" }, { "x-forwarded-proto": "file" }]) {
    assert.equal(allowedMutation(new Request("https://biblioteca.example/api/auth/login", {
      method: "POST", headers: { host: "biblioteca.example", origin: "https://biblioteca.example", ...extra },
    })), false);
  }
});
