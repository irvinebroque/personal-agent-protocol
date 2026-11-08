# MOLE private-access extension

## 1. Introduction

This page defines version 1 of the `mole` extension. It uses revision 01 of the [MOLE architecture](https://datatracker.ietf.org/doc/html/draft-jms-mole-architecture-01), [protocols](https://datatracker.ietf.org/doc/html/draft-jms-mole-protocols-01), and [HTTP transport](https://datatracker.ietf.org/doc/html/draft-jms-mole-http-transport-01). A matching extension version does not establish compatibility with later MOLE revisions.

A Personal Agent can use a MOLE credential to access a public read-only resource without a Poppy User ID, Session, or account token. The Company can enforce its access policy through credential proofs and updates. A User can later choose a Session for continuity, and OAuth account access when a task needs it. These are independent choices, not required steps.

Poppy already permits a fresh User ID for each anonymous browsing session ([5.1](https://personalagentprotocol.org/docs/0.4/spec#user-ids)). This extension adds a way to limit access without relying on that ID. Version 1 covers public pages and read-only HTTP APIs. It does not define private conversations, account access, writes, or an MCP authentication profile.

## 2. Advertising support

A Company can advertise `mole` in `extensions` in its `poppy.json` ([3.3](https://personalagentprotocol.org/docs/0.4/spec#extensions)) and provide its Moderator configuration:

*Excerpt from poppy.json*

```
"extensions": {
  "mole": [{
    "version": "1",
    "moderator_config_uri": "https://example.com/mole/config"
  }]
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `version` | Yes | `1`, for this profile. |
| `moderator_config_uri` | Yes | The HTTPS URL of the MOLE Moderator configuration. |

This advertisement helps configuration discovery; it is not a prerequisite for an initial private request and does not promise access. This extension defines no resource allowlist. The resource's response and access policy determine whether it serves the request, requires MOLE, or refuses access.

The Company MUST publish the configuration URL on the origin of `https://{organization.domain}`. The Personal Agent MUST reject a configuration URL with user information, a query, or a fragment, or on another origin. The Personal Agent MUST fetch configuration without identifying cookies, account tokens, or a Session header, and MUST NOT follow a redirect from that URL. Other URLs obtained from configuration follow Poppy's HTTPS, address, and redirect rules ([3](https://personalagentprotocol.org/docs/0.4/spec#discovery)) and the referenced MOLE drafts.

A Personal Agent can obtain Moderator configuration through this advertisement or trusted client configuration. A challenge alone does not establish the Moderator's configuration or trust. The Personal Agent MUST NOT guess configuration endpoints or present a credential to an unverified Moderator. If it cannot obtain the configuration needed for an exchange, it stops or asks the User.

For direct HTTP requests, the Personal Agent MAY declare `Poppy-Extensions: "mole";v="1"`. A Company that offers MOLE MUST allow private negotiation without requiring `Poppy-Extensions` or `Poppy-Version`, including on the initial request. Personal Agents ignore unknown extension versions. The discovery schema is `mole-extension.schema.json` in the Company kit.

## 3. Anchors and eligibility

MOLE has three roles. A Client seeks access. An Anchor grants an endorsement under its eligibility policy. A Moderator accepts endorsements under its trust policy and issues credentials that it can verify and update. A Company can run the Moderator or use a provider. The roles do not have to share an operator.

The Company's Moderator chooses the trusted Anchor set in its configuration. An agent provider could act as an Anchor through an authenticated user relationship and abuse controls. Another service could enforce an account, entitlement, or verification policy. A browser remains a Client; running JavaScript or creating a wallet does not establish eligibility.

The Company SHOULD document the eligibility policies it accepts and what limits repeated grants. This profile requires EC-IHAT endorsements, type `0x0002`, and EC-ACT credentials, type `0x0001`, as defined in the referenced MOLE protocols draft. The Personal Agent MUST verify that its Anchor configuration matches the Moderator's accepted set and epoch before requesting an endorsement. Anchor-service discovery and the Anchor's user authentication remain outside Poppy. Wallets can use configured Anchor services; this profile requires no central registry.

The Personal Agent MUST keep Anchor authentication at the Anchor, and MUST NOT send a Moderator challenge, Company browsing history, or Poppy User ID in the grant request. A self-created wallet or a caller signature alone does not prove a scarce entitlement. The Company SHOULD assess endorsement scarcity and configuration consistency under the MOLE architecture's privacy model.

## 4. Private requests

A Personal Agent MAY start a private request for public, read-only content without prior MOLE advertisement, without creating a User ID or Session, and before receiving a challenge. The Personal Agent MUST omit the Session header, account tokens, DPoP proofs, identifying cookies, and other per-user identifiers from the initial request and subsequent private exchanges. This is the explicit exception to the Session rules in [5.1](https://personalagentprotocol.org/docs/0.4/spec#user-ids), [5.2](https://personalagentprotocol.org/docs/0.4/spec#session-header), and [5.6](https://personalagentprotocol.org/docs/0.4/spec#sending-requests).

The resource can serve the request without authentication, issue a MOLE challenge, or refuse access under its policy. The Personal Agent MAY answer a MOLE challenge using verified configuration. A Company that offers MOLE at a resource MUST support that exchange without requiring a User ID, Session, or account cookie. A private attempt does not oblige the Company to grant access or enable MOLE on an endpoint.

Version 1 covers public pages, assets, and read-only HTTP APIs, including read-only `POST` operations such as catalog search. It does not authorize writes, account data, OAuth endpoints, browser-join endpoints, Poppy conversations, or MCP exchanges; those keep their existing rules. MOLE credential accounting itself can change state.

The Personal Agent and Company MUST follow [MOLE Protocols revision 01](https://datatracker.ietf.org/doc/html/draft-jms-mole-protocols-01) and [MOLE HTTP Transport revision 01](https://datatracker.ietf.org/doc/html/draft-jms-mole-http-transport-01). Those specifications define the exchanges, durable client state, credential updates, replay protection, recovery, caching, and cross-origin response headers.

Operation binding follows [MOLE Protocols 5.2.3.1](https://datatracker.ietf.org/doc/html/draft-jms-mole-protocols-01#section-5.2.3.1). This extension defines no additional HTTP request serialization or operation-binding format.

A MOLE allowance does not grant OAuth scopes or permission to read account data.

A Personal Agent that cannot satisfy a MOLE challenge, or whose request requires a Session or account access, stops or asks the User to approve another mode. The Personal Agent MUST NOT silently attach a Session, sign in, or create another wallet to evade an exhausted allowance.

## 5. Browser and HTTP clients

The wallet can run in trusted browser integration or in the Personal Agent's runtime. This profile does not define a browser JavaScript API, require a particular wallet library, or assume a shipping browser credential-injection feature. A browser integration needs to handle the MOLE exchange for the requests it makes; a library in page JavaScript does not cover arbitrary navigations.

The Personal Agent MUST isolate private browsing from identifying cookies, site storage, service workers, account state, and prior browser joins. The Personal Agent MUST NOT join that private browser context to a Poppy Session. This is the exception to mandatory browser joining in [section 6](https://personalagentprotocol.org/docs/0.4/spec#web-browsing), including during initial private negotiation. The Company's `web.disabled` preference still applies. A Personal Agent that cannot isolate the context MUST NOT describe that browsing as private access under this profile.

The Personal Agent MUST maintain identity isolation for navigations, redirects, and subresource requests. Pages, images, stylesheets, and other assets can each require MOLE; the browser can handle those challenges without changing modes or asking for approval on each asset. If a request requires a Session or account, the Personal Agent MUST stop it until the User approves that transition. For later browser access with a Session or account, the Personal Agent MUST use a separate context and MUST NOT join the private context after approval.

Direct HTTP clients need the same separation from user identity. The Personal Agent MUST keep endorsements, credentials, continuation state, and pending authorization values outside model context ([10.2](https://personalagentprotocol.org/docs/0.4/spec#secrets)).

Operator recognition remains a separate policy. A Company can require an operator-level Web Bot Auth signature when its browser or HTTP integration supports it. The Company MUST NOT require a Poppy User ID, per-user key directory, wallet identifier, or Session delegation as operator recognition for this private profile. A valid operator signature does not verify a MOLE proof. An operator signing service can itself observe traffic, as the [guides](https://personalagentprotocol.org/docs/0.4/guides#both-operator-signatures) explain.

## 6. Choosing continuity and account access

When the User wants continuity, the Personal Agent starts or resumes an ordinary Poppy Session. The Personal Agent MUST explain which facts it will share and obtain the User's approval before linking private work to a Session or account. The Personal Agent MUST share only the approved facts, and MUST NOT transfer private query history, endorsements, credentials, or wallet identifiers as part of that transition. For example, **Save this shortlist with Poppy** can share the checked products without sharing the preceding searches.

The Company MUST NOT use MOLE wallet state as a bridge to Session ownership or account identity. An ordinary conversation after approval follows Poppy's existing request and Session rules. Account access follows the existing OAuth flows and scope approval. A private credential does not replace those permissions.

The Personal Agent MUST NOT automatically change modes after a redirect, rate limit, challenge, or task that needs more access. It stops or asks for the appropriate User approval. Credentials and Session JWTs never follow a redirect to a new destination; the Personal Agent evaluates the new resource separately under the applicable mode.

## 7. Privacy and deployment limits

MOLE's credential properties do not hide IP addresses, timing, query contents, operator identity, or shared infrastructure. The Company SHOULD evaluate Anchor-set size, configuration consistency, logging, network correlation, and collusion under the referenced architecture. A single-operator demonstration does not establish anonymity against that operator.

The Company SHOULD document key rotation and bounded retention for recovery and replay state. Neither starting a new chat nor opening a private browser window grants a fresh allowance. Deployments choose their eligibility policies and initial allowances. This profile does not define application result recovery or a wallet library API.

---

Licensed under the [Apache License 2.0](https://personalagentprotocol.org/license).
