import assert from "node:assert/strict";
import { test } from "node:test";

import { parseFrame } from "./payload.js";

test("parseFrame splits a text frame into serial and value", () => {
	const result = parseFrame("70-B3-D5-7E-D0-12-34-56,41BC7E1F2A");

	assert.deepEqual(result, {
		serial: "70-B3-D5-7E-D0-12-34-56",
		value: "41BC7E1F2A",
	});
});

test("parseFrame trims surrounding whitespace from serial and value", () => {
	const result = parseFrame("  10000 , 41BC7E1F2A  ");

	assert.deepEqual(result, { serial: "10000", value: "41BC7E1F2A" });
});

test("parseFrame returns null when the separator is missing", () => {
	assert.equal(parseFrame("41BC7E1F2A"), null);
});

test("parseFrame returns null when the serial is empty", () => {
	assert.equal(parseFrame(",41BC7E1F2A"), null);
});

test("parseFrame returns null when the value is empty", () => {
	assert.equal(parseFrame("10000,"), null);
});
