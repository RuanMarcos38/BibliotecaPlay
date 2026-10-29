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
