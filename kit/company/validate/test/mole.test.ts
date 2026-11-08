import assert from "node:assert/strict";
import { test } from "node:test";
import { PROTOCOL_VERSION } from "../catalog.ts";
import { check } from "../schemas.ts";

const profile = {
    version: "1",
    moderator_config_uri: "https://example.com/mole/config",
};

function discovery(entry?: object) {
    return {
        protocol_version: PROTOCOL_VERSION,
        organization: { name: "Example Company", domain: "example.com" },
        web: {},
        ...(entry ? { extensions: { mole: [entry] } } : {}),
    };
}

test("MOLE discovery accepts configuration without a resource allowlist", () => {
    assert.deepEqual(check("poppy.schema.json", discovery(profile)), []);
    assert.deepEqual(check("mole-extension.schema.json", profile), []);
    assert.deepEqual(check("poppy.schema.json", discovery()), []);
});

test("MOLE advertisements require a version and Moderator configuration", () => {
    for (const field of ["version", "moderator_config_uri"]) {
        const entry: Record<string, unknown> = { ...profile };
        delete entry[field];
        assert.ok(check("poppy.schema.json", discovery(entry)).length > 0, field);
    }
    for (const entry of [
        { ...profile, version: 1 },
        { ...profile, version: "" },
        { ...profile, moderator_config_uri: null },
        { ...profile, moderator_config_uri: 123 },
    ]) {
        assert.ok(check("poppy.schema.json", discovery(entry)).length > 0);
    }
});

test("MOLE configuration URLs reject insecure and identifying declarations", () => {
    for (const url of [
        "http://example.com/mole/config",
        "https://user:password@example.com/mole/config",
        "https://example.com/mole/config?user=123",
        "https://example.com/mole/config#session",
        "https://example.com/mole/a\\b",
        "",
    ]) {
        const entry = { ...profile, moderator_config_uri: url };
        assert.ok(check("mole-extension.schema.json", entry).length > 0, url);
        assert.ok(check("poppy.schema.json", discovery(entry)).length > 0, url);
    }
});

test("MOLE discovery keeps Poppy's unknown-version and unknown-field behavior", () => {
    assert.deepEqual(
        check("poppy.schema.json", discovery({ version: "2", future_profile: true })),
        [],
    );
    assert.deepEqual(check("poppy.schema.json", discovery({ ...profile, future_field: true })), []);
});
