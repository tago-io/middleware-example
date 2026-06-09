import { test } from "node:test";
import assert from "node:assert/strict";

import { createFrameSplitter } from "./framing.js";

const delimiter = Buffer.from("\n");

test("emits one frame for a single delimited chunk", () => {
  const splitter = createFrameSplitter(delimiter);

  assert.deepEqual(splitter.push(Buffer.from("hello\n")), ["hello"]);
});

test("splits multiple frames contained in one chunk", () => {
  const splitter = createFrameSplitter(delimiter);

  assert.deepEqual(splitter.push(Buffer.from("a\nb\nc\n")), ["a", "b", "c"]);
});

test("buffers a fragmented frame across chunks until the delimiter arrives", () => {
  const splitter = createFrameSplitter(delimiter);

  assert.deepEqual(splitter.push(Buffer.from("hel")), []);
  assert.deepEqual(splitter.push(Buffer.from("lo")), []);
  assert.deepEqual(splitter.push(Buffer.from("\n")), ["hello"]);
});

test("keeps a trailing partial frame buffered without emitting it", () => {
  const splitter = createFrameSplitter(delimiter);

  assert.deepEqual(splitter.push(Buffer.from("done\npartial")), ["done"]);
});

test("drops empty frames produced by back-to-back delimiters", () => {
  const splitter = createFrameSplitter(delimiter);

  assert.deepEqual(splitter.push(Buffer.from("a\n\nb\n")), ["a", "b"]);
});

test("exposes an unterminated frame as pending", () => {
  const splitter = createFrameSplitter(delimiter);

  splitter.push(Buffer.from("serial,010929"));
  assert.equal(splitter.pending(), "serial,010929");
});

test("clears pending once the delimiter arrives", () => {
  const splitter = createFrameSplitter(delimiter);

  splitter.push(Buffer.from("serial,010929"));
  splitter.push(Buffer.from("\n"));
  assert.equal(splitter.pending(), "");
});
