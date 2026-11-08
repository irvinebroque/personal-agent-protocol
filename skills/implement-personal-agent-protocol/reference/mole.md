# MOLE private-access extension

## 1. Introduction

This page proposes version 1 of the `mole` extension. It is an experimental proposal for review, not an adopted Poppy feature or a final MOLE standard. It references revision 01 of the [MOLE architecture](https://datatracker.ietf.org/doc/html/draft-jms-mole-architecture-01), [protocols](https://datatracker.ietf.org/doc/html/draft-jms-mole-protocols-01), and [HTTP transport](https://datatracker.ietf.org/doc/html/draft-jms-mole-http-transport-01). Those documents remain works in progress. Changes to their wire formats need a new interoperability review; a matching extension version alone does not establish compatibility with later MOLE drafts.

A Personal Agent can use a MOLE credential to access an advertised public resource without a Poppy User ID, Session, or account token. The Company can enforce its access policy through credential proofs and updates. A User can later choose a Session for continuity, and OAuth account access when a task needs it. These are independent choices, not required steps.

Poppy already permits a fresh User ID for each anonymous browsing session ([5.1](https://personalagentprotocol.org/docs/0.4/spec#user-ids)). This extension adds a way to limit access without relying on that ID. Version 1 covers public pages and read-only HTTP APIs. It does not define private conversations, account access, writes, or an MCP authentication profile.

## 2. Advertising support

A Company that offers private access lists `mole` in `extensions` in its `poppy.json` ([3.3](https://personalagentprotocol.org/docs/0.4/spec#extensions)):

*Excerpt from poppy.json*

```
"extensions": {
  "mole": [{
    "version": "1",
    "moderator_config_uri": "https://example.com/mole/config",
    "resources": [
      { "url": "https://example.com/api/catalog/search", "methods": ["POST"] },
      { "url": "https://example.com/products/", "methods": ["GET", "HEAD"], "subpaths": true }
    ]
  }]
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `version` | Yes | `1`, for this proposed profile. |
| `moderator_config_uri` | Yes | The HTTPS URL of the MOLE Moderator configuration. |
| `resources` | Yes | A nonempty list of eligible resources. |
| `resources[].url` | Yes | The HTTPS origin and path to match. No user information, query, or fragment. |
| `resources[].methods` | Yes | A nonempty list drawn from `GET`, `HEAD`, and read-only `POST`. |
| `resources[].subpaths` | No | Defaults to `false`. When `true`, the path ends in `/` and also matches its descendants. |

The Company MUST publish the configuration URL and resource URLs on the origin of `https://{organization.domain}`. The Personal Agent MUST reject an entry that violates that rule or names a URL with user information, a query, or a fragment. The Personal Agent MUST fetch the configuration without identifying cookies, account tokens, or a Session header, and MUST NOT follow a redirect from that URL. Other URLs obtained from configuration follow Poppy's HTTPS, address, and redirect rules ([3](https://personalagentprotocol.org/docs/0.4/spec#discovery)) and the referenced MOLE drafts.

The Company MUST list only public, read-only resources. The Company MUST NOT list OAuth endpoints, browser-join endpoints, Poppy conversation endpoints, MCP endpoints, account data, or an operation that changes application state. A read-only `POST` can search a catalog; it cannot create a cart or approve an order. MOLE credential accounting itself can change state.

The Personal Agent MUST match the request's origin, method, and path against a resource entry. An exact entry matches that path only. A `subpaths` entry matches the listed trailing-slash path and paths below it, never a string prefix such as `/products-other`. The Personal Agent MUST reject resource entries and private request paths with dot segments, backslashes, or encoded path separators rather than using path normalization to expand the eligible scope. Query values do not select the scope, but remain part of the request and its operation binding (section 4). Sharing an origin does not make another resource eligible.

For direct HTTP requests, the Personal Agent declares the extension with `Poppy-Extensions: "mole";v="1"`. Browser integration can use the advertised resource and its MOLE challenge without adding a Poppy-specific header, as an extension that the Company recognizes from the exchange ([3.3](https://personalagentprotocol.org/docs/0.4/spec#extensions)). The Company MUST accept this browser use without requiring `Poppy-Extensions` or `Poppy-Version`. Support does not promise access: runtime challenges and policy remain authoritative. Personal Agents ignore unknown extension versions.

The discovery schema is `mole-extension.schema.json` in the Company kit. It checks the declaration's shape; the origin, path, and read-only rules above also need implementation checks.

## 3. Anchors and eligibility

MOLE has three roles. A Client seeks access. An Anchor grants an endorsement under its eligibility policy. A Moderator accepts endorsements under its trust policy and issues credentials that it can verify and update. A Company can run the Moderator or use a provider. The roles do not have to share an operator.

The Company's Moderator chooses the trusted Anchor set in its configuration. An agent provider could act as an Anchor through an authenticated user relationship and abuse controls. Another service could enforce an account, entitlement, or verification policy. A browser remains a Client; running JavaScript or creating a wallet does not establish eligibility.

The Company SHOULD document the eligibility policies it accepts and what limits repeated grants. This profile requires EC-IHAT endorsements, type `0x0002`, and EC-ACT credentials, type `0x0001`, as defined in the referenced MOLE protocols draft. The Personal Agent MUST verify that its Anchor configuration matches the Moderator's accepted set and epoch before requesting an endorsement. Anchor-service discovery and the Anchor's user authentication remain outside Poppy. Wallets can use configured Anchor services; this profile requires no central registry.

The Personal Agent MUST keep Anchor authentication at the Anchor, and MUST NOT send a Moderator challenge, Company browsing history, or Poppy User ID in the grant request. A self-created wallet or a caller signature alone does not prove a scarce entitlement. The Company SHOULD assess endorsement scarcity and configuration consistency under the MOLE architecture's privacy model.

## 4. Private requests

For an eligible resource, the Personal Agent MAY select private access. The Personal Agent MUST omit the Session header, account tokens, DPoP proofs, and other per-user identifiers from those requests. The Company MUST support this mode without requiring a User ID, Session, or account cookie. This is the explicit exception to the Session rules in [5.1](https://personalagentprotocol.org/docs/0.4/spec#user-ids), [5.2](https://personalagentprotocol.org/docs/0.4/spec#session-header), and [5.6](https://personalagentprotocol.org/docs/0.4/spec#sending-requests).

The Personal Agent and Company MUST follow the referenced MOLE HTTP transport for challenges, issuance, presentations, updates, and recovery. The Company MUST bind an EC-ACT presentation to the request's method, full target URL including its query, and body bytes, using the credential protocol's operation-binding mechanism. Discovery matching does not weaken this binding.

The Personal Agent MUST process credential updates across HTTP response statuses, serialize use of a credential, and preserve pending exchange state before transmission. After an uncertain presentation, the Personal Agent MUST settle the saved exchange before starting another spend. Recovery settles the credential decision, not successful application execution or another authorization. This profile does not add application result recovery or a right to refill.

The Company MUST preserve replay protection within its declared replay scope and MUST NOT treat a recovered presentation as authorization to execute another operation. The Company MUST retain the MOLE response's cache protections and expose the required authentication and update headers when it permits cross-origin wallet requests. A MOLE allowance does not grant OAuth scopes or permission to read account data.

Outside an advertised resource, the ordinary Poppy rules apply. A Personal Agent that cannot satisfy a private challenge stops or asks the User to choose another mode. The Personal Agent MUST NOT silently attach a Session, sign in, or create another wallet to evade an exhausted allowance.

## 5. Browser and HTTP clients

The wallet can run in trusted browser integration or in the Personal Agent's runtime. This profile does not define a browser JavaScript API, require a particular wallet library, or assume a shipping browser credential-injection feature. A browser integration needs to handle the MOLE exchange for the requests it makes; a library in page JavaScript does not cover arbitrary navigations.

The Personal Agent MUST isolate private browsing from identifying cookies, site storage, service workers, account state, and prior browser joins. The Personal Agent MUST NOT join that private browser context to a Poppy Session. This is the exception to mandatory browser joining in [section 6](https://personalagentprotocol.org/docs/0.4/spec#web-browsing), only for the advertised private resources. The Company's `web.disabled` preference still applies. A Personal Agent that cannot isolate the context MUST NOT describe that browsing as private access under this profile.

The Personal Agent MUST enforce the private-resource scope and isolation rules for navigations, redirects, and subresource requests. It MUST stop an out-of-scope browser request until the User approves another mode. For later browser access with a Session or account, the Personal Agent MUST use a separate context. The Personal Agent MUST NOT join the private context after that approval.

Direct HTTP clients need the same separation from user identity and the same wallet-state rules. The Personal Agent MUST keep endorsements, credentials, continuation state, and pending authorization values outside model context ([10.2](https://personalagentprotocol.org/docs/0.4/spec#secrets)).

Operator recognition remains a separate policy. A Company can require an operator-level Web Bot Auth signature when its browser or HTTP integration supports it. The Company MUST NOT require a Poppy User ID, per-user key directory, wallet identifier, or Session delegation as operator recognition for this private profile. A valid operator signature does not verify a MOLE proof. An operator signing service can itself observe traffic, as the [guides](https://personalagentprotocol.org/docs/0.4/guides#both-operator-signatures) explain.

## 6. Choosing continuity and account access

When the User wants continuity, the Personal Agent starts or resumes an ordinary Poppy Session. The Personal Agent MUST explain which facts it will share and obtain the User's approval before linking private work to a Session or account. The Personal Agent MUST share only the approved facts, and MUST NOT transfer private query history, endorsements, credentials, or wallet identifiers as part of that transition. For example, **Save this shortlist with Poppy** can share the checked products without sharing the preceding searches.

The Company MUST NOT use MOLE wallet state as a bridge to Session ownership or account identity. An ordinary conversation after approval follows Poppy's existing request and Session rules. Account access follows the existing OAuth flows and scope approval. A private credential does not replace those permissions.

The Personal Agent MUST NOT automatically change modes after a redirect, rate limit, challenge, or task that needs more access. It stops or asks for the appropriate User approval. Credentials and Session JWTs never follow a redirect to a new destination; the Personal Agent evaluates the new resource separately under the applicable mode.

## 7. Privacy and deployment limits

MOLE's credential properties do not hide IP addresses, timing, query contents, operator identity, or shared infrastructure. The Company SHOULD evaluate Anchor-set size, configuration consistency, logging, network correlation, and collusion under the referenced architecture. A single-operator demonstration does not establish anonymity against that operator.

The Company SHOULD document key rotation and bounded retention for recovery and replay state. Neither starting a new chat nor opening a private browser window grants a fresh allowance. Deployments choose their eligibility policies and initial allowances. This profile does not define application result recovery or a wallet library API.

## 8. Questions for review

- Should `mole` become a reserved extension name, and are these discovery fields sufficient?
- How should a wallet discover Anchor services without a mandatory central directory?
- Which browser integrations can enforce credential and identity isolation for navigation and subresources? What CORS and multi-tab behavior needs an implementation guide?
- Should later versions support other MOLE types, writes, conversations, or MCP? Those need their own authorization, operation-binding, and retry analysis.
- What interoperability evidence should precede adoption while the referenced MOLE drafts evolve?

---

Licensed under the [Apache License 2.0](https://personalagentprotocol.org/license).
