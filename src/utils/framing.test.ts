import { test } from "node:test";
import assert from "node:assert/strict";

import { createFrameSplitter } from "./framing.js";

const makeSplitter = (maxFrameLength = 65536) =>
  createFrameSplitter({ delimiter: "\n", maxFrameLength });

test("emits one frame for a single delimited chunk", () => {
  const splitter = makeSplitter();

  assert.deepEqual(splitter.push(Buffer.from("hello\n")), ["hello"]);
});

test("splits multiple frames contained in one chunk", () => {
  const splitter = makeSplitter();

  assert.deepEqual(splitter.push(Buffer.from("a\nb\nc\n")), ["a", "b", "c"]);
});

test("buffers a fragmented frame across chunks until the delimiter arrives", () => {
  const splitter = makeSplitter();

  assert.deepEqual(splitter.push(Buffer.from("hel")), []);
  assert.deepEqual(splitter.push(Buffer.from("lo")), []);
  assert.deepEqual(splitter.push(Buffer.from("\n")), ["hello"]);
});

test("keeps a trailing partial frame buffered without emitting it", () => {
  const splitter = makeSplitter();

  assert.deepEqual(splitter.push(Buffer.from("done\npartial")), ["done"]);
});

test("drops empty frames produced by back-to-back delimiters", () => {
  const splitter = makeSplitter();

  assert.deepEqual(splitter.push(Buffer.from("a\n\nb\n")), ["a", "b"]);
});

test("exposes an unterminated frame as pending", () => {
  const splitter = makeSplitter();

  splitter.push(Buffer.from("serial,010929"));
  assert.equal(splitter.pending(), "serial,010929");
});

test("clears pending once the delimiter arrives", () => {
  const splitter = makeSplitter();

  splitter.push(Buffer.from("serial,010929"));
  splitter.push(Buffer.from("\n"));
  assert.equal(splitter.pending(), "");
});

test("throws when a pending frame grows past maxFrameLength", () => {
  const splitter = makeSplitter(8);

  assert.throws(
    () => splitter.push(Buffer.from("0123456789")),
    /maxFrameLength/,
  );
});

test("clears the buffer after overflow so the next chunk starts clean", () => {
  const splitter = makeSplitter(8);

  assert.throws(() => splitter.push(Buffer.from("0123456789")));
  assert.deepEqual(splitter.push(Buffer.from("ok\n")), ["ok"]);
});

test("does not throw when complete frames stay within maxFrameLength", () => {
  const splitter = makeSplitter(4);

  assert.deepEqual(splitter.push(Buffer.from("abcd\nefgh\n")), ["abcd", "efgh"]);
});
