import assert from "node:assert/strict";
import { test } from "node:test";
import { PROTOCOL_VERSION } from "../catalog.ts";
import { check } from "../schemas.ts";

const resource = { url: "https://example.com/products/", methods: ["GET", "HEAD"], subpaths: true };
const profile = {
    version: "1",
    moderator_config_uri: "https://example.com/mole/config",
    resources: [resource],
};

function discovery(entry: object) {
    return {
        protocol_version: PROTOCOL_VERSION,
        organization: { name: "Example Company", domain: "example.com" },
        web: {},
        extensions: { mole: [entry] },
    };
}

test("MOLE discovery requires configuration and resource declarations", () => {
    assert.deepEqual(check("poppy.schema.json", discovery(profile)), []);
    assert.deepEqual(
        check("mole-extension.schema.json", {
            ...profile,
            resources: [{ url: "https://example.com/api/search", methods: ["POST"] }],
        }),
        [],
    );
    for (const field of ["version", "moderator_config_uri", "resources"]) {
        const entry: Record<string, unknown> = { ...profile };
        delete entry[field];
        assert.ok(check("poppy.schema.json", discovery(entry)).length > 0, field);
    }
    for (const resources of [[], [{ url: resource.url }], [{ methods: ["GET"] }]]) {
        assert.ok(check("poppy.schema.json", discovery({ ...profile, resources })).length > 0);
    }
});

test("MOLE declarations reject credential-bearing URLs and ambiguous paths", () => {
    for (const url of [
        "http://example.com/products/",
        "https://user:password@example.com/products/",
        "https://example.com/products/?user=123",
        "https://example.com/products/#session",
        "https://example.com/products/../orders",
        "https://example.com/products/%2e%2e/orders",
        "https://example.com/products/a%2Fb",
        "https://example.com/products/a%5cb",
        "https://example.com/products/a\\b",
    ]) {
        assert.ok(
            check("mole-extension.schema.json", { ...profile, moderator_config_uri: url }).length >
                0,
            url,
        );
        assert.ok(
            check("poppy.schema.json", discovery({ ...profile, resources: [{ ...resource, url }] }))
                .length > 0,
            url,
        );
    }
});

test("MOLE resource entries require slash prefixes and supported methods", () => {
    for (const entry of [
        { ...resource, url: "https://example.com/products" },
        { ...resource, subpaths: "true" },
        { ...resource, methods: [] },
        ...["PUT", "PATCH", "DELETE", "get"].map((method) => ({ ...resource, methods: [method] })),
    ]) {
        assert.ok(
            check("poppy.schema.json", discovery({ ...profile, resources: [entry] })).length > 0,
            JSON.stringify(entry),
        );
    }
});

test("MOLE discovery keeps Poppy's unknown-version and unknown-field behavior", () => {
    assert.deepEqual(
        check("poppy.schema.json", discovery({ version: "2", future_profile: true })),
        [],
    );
    assert.deepEqual(check("poppy.schema.json", discovery({ ...profile, future_field: true })), []);
});
