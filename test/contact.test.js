// Local tests for api/contact.js. Run: node test/contact.test.js
// Mocks req/res and global fetch. No network, no dependencies.
const assert = require("node:assert/strict");

// Shared module state (rate-limit map) is loaded once.
delete require.cache[require.resolve("../api/contact.js")];
const handler = require("../api/contact.js");

const logs = [];
const origLog = console.log;
console.log = (...args) => {
  logs.push(args.map(String).join(" "));
};

const fetchCalls = [];
let turnstileOk = true;
global.fetch = async (url, opts = {}) => {
  fetchCalls.push({ url: String(url), opts });
  if (String(url).includes("api.resend.com")) {
    return { ok: true, status: 200, json: async () => ({ id: "email_test" }) };
  }
  if (String(url).includes("challenges.cloudflare.com/turnstile")) {
    return { ok: true, status: 200, json: async () => ({ success: turnstileOk }) };
  }
  return { ok: false, status: 404, json: async () => ({}) };
};

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) {
      this.headers[String(k).toLowerCase()] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.body = obj;
      return this;
    },
    end(d) {
      if (d !== undefined) this.body = d;
    },
  };
  return res;
}

function mockReq({ body, ip = "203.0.113.1", method = "POST", headers = {} }) {
  return {
    method,
    body,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-forwarded-for": ip,
      ...headers,
    },
  };
}

function setMailEnv() {
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.CONTACT_TO = "inbox@example.com";
  process.env.CONTACT_FROM = "site@example.com";
}

function clearTurnstile() {
  delete process.env.TURNSTILE_SECRET_KEY;
}

function legit(overrides = {}) {
  return {
    name: "Ada Lovelace",
    email: "ada@example.com",
    topic: "Press",
    message: "Hello, I would like to write a feature about the new album and the upcoming tour dates.",
    consent: "yes",
    started: String(Date.now() - 5000),
    ...overrides,
  };
}

function resendCalls() {
  return fetchCalls.filter((c) => c.url.includes("api.resend.com"));
}

function turnstileCalls() {
  return fetchCalls.filter((c) => c.url.includes("turnstile"));
}

function parseResendBody(call) {
  return JSON.parse(call.opts.body);
}

async function post(body, ip) {
  const req = mockReq({ body, ip });
  const res = mockRes();
  await handler(req, res);
  return res;
}

function dropped(res, reasonPart) {
  assert.equal(res.statusCode, 200);
  assert.equal(res.body && res.body.ok, true);
  assert.equal(res.body.message, "Thanks, your message is on its way.");
  assert.equal(resendCalls().length, 0, "Resend should not be called");
  const hit = logs.find((l) => l.startsWith("contact: dropped") && l.includes(reasonPart));
  assert.ok(hit, `expected log containing ${JSON.stringify(reasonPart)}, got: ${JSON.stringify(logs)}`);
}

async function run() {
  let failed = 0;
  async function test(name, fn) {
    fetchCalls.length = 0;
    logs.length = 0;
    setMailEnv();
    clearTurnstile();
    turnstileOk = true;
    try {
      await fn();
      origLog(`  ok  ${name}`);
    } catch (err) {
      failed++;
      origLog(`  FAIL  ${name}`);
      origLog("    " + (err && err.stack ? err.stack : err));
    }
  }

  await test("legit message passes and calls Resend with reply_to", async () => {
    const res = await post(legit(), "203.0.113.10");
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { ok: true, message: "Thanks, your message is on its way." });
    assert.equal(resendCalls().length, 1);
    assert.equal(turnstileCalls().length, 0, "Turnstile must be skipped when no secret is set");
    const payload = parseResendBody(resendCalls()[0]);
    assert.equal(payload.reply_to, "ada@example.com");
    assert.equal(payload.from, "site@example.com");
    assert.deepEqual(payload.to, ["inbox@example.com"]);
    assert.match(payload.subject, /Press: Ada Lovelace/);
  });

  await test("own-domain email dropped (and never used as reply_to)", async () => {
    const res = await post(legit({ email: "maik@glitchedrecords.com" }), "203.0.113.11");
    dropped(res, "own-domain email (glitchedrecords.com)");
    assert.ok(!logs.some((l) => l.includes("maik@")), "log must not include the local part");
  });

  await test("own-domain subdomain and sibling domains dropped", async () => {
    for (const email of ["bot@mail.thetrophyhoe.com", "x@TheAntichrist.AI", "press@studio.glitchedrecords.com"]) {
      fetchCalls.length = 0;
      logs.length = 0;
      const res = await post(legit({ email }), "203.0.113.12");
      dropped(res, "own-domain email");
    }
  });

  await test("lookalike domain is not treated as own-domain", async () => {
    const res = await post(legit({ email: "ada@notglitchedrecords.com" }), "203.0.113.13");
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(resendCalls().length, 1);
    assert.equal(parseResendBody(resendCalls()[0]).reply_to, "ada@notglitchedrecords.com");
  });

  await test("link-only message dropped", async () => {
    const res = await post(legit({ message: "https://spam.example/dog-harness" }), "203.0.113.14");
    dropped(res, "link-spam");
  });

  await test("short caption plus one link dropped; four URLs dropped", async () => {
    let res = await post(legit({ message: "Check this out https://spam.example/x" }), "203.0.113.15");
    dropped(res, "link-spam");
    fetchCalls.length = 0;
    logs.length = 0;
    res = await post(
      legit({
        message: "one https://a.example two https://b.example three https://c.example four https://d.example and more words here too",
      }),
      "203.0.113.16",
    );
    dropped(res, "link-spam");
  });

  await test("substantive message with one URL still sends", async () => {
    const res = await post(
      legit({
        message: "I wanted to share an article I wrote about your latest release and what it means for the scene https://journal.example/again",
      }),
      "203.0.113.17",
    );
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(resendCalls().length, 1);
  });

  await test("honeypot dropped", async () => {
    const res = await post(legit({ website: "http://bots.example" }), "203.0.113.18");
    dropped(res, "honeypot");
  });

  await test("too-fast dropped", async () => {
    const res = await post(legit({ started: String(Date.now() - 400) }), "203.0.113.19");
    dropped(res, "too-fast");
  });

  await test("missing timestamp allowed when Turnstile is off (no-JS)", async () => {
    const res = await post(legit({ started: "" }), "203.0.113.20");
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(resendCalls().length, 1);
  });

  await test("garbage timestamp dropped when Turnstile is off", async () => {
    const res = await post(legit({ started: "not-a-time" }), "203.0.113.21");
    dropped(res, "bad-timestamp");
  });

  await test("turnstile skipped when no keys", async () => {
    const res = await post(legit(), "203.0.113.22");
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(turnstileCalls().length, 0);
    assert.equal(resendCalls().length, 1);
  });

  await test("turnstile required when secret is set; missing token returns 400", async () => {
    process.env.TURNSTILE_SECRET_KEY = "ts_secret";
    const res = await post(legit(), "203.0.113.23");
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.ok, false);
    assert.match(res.body.message, /verification/i);
    assert.equal(resendCalls().length, 0);
    assert.equal(turnstileCalls().length, 0);
  });

  await test("turnstile pass allows send; missing timestamp allowed after pass", async () => {
    process.env.TURNSTILE_SECRET_KEY = "ts_secret";
    const res = await post(legit({ started: "", "cf-turnstile-response": "token-ok" }), "203.0.113.24");
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.equal(turnstileCalls().length, 1);
    assert.equal(resendCalls().length, 1);
  });

  await test("rate limit triggers on a fourth post from the same IP", async () => {
    const ip = "198.51.100.9";
    for (let i = 0; i < 3; i++) {
      fetchCalls.length = 0;
      logs.length = 0;
      const res = await post(legit({ message: legit().message + " run " + i }), ip);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.ok, true);
      assert.equal(resendCalls().length, 1, `send ${i + 1} should call Resend`);
    }
    fetchCalls.length = 0;
    logs.length = 0;
    const res = await post(legit({ message: legit().message + " run 3" }), ip);
    dropped(res, "rate-limit");
  });

  console.log = origLog;
  if (failed) {
    origLog(`\n${failed} test(s) failed`);
    process.exit(1);
  }
  origLog("\nAll tests passed.");
}

run().catch((err) => {
  console.log = origLog;
  console.error(err);
  process.exit(1);
});
