import net from "node:net";

import { config } from "./config.js";
import { getPendingDownlink } from "./downlink/downink-class-a.js";
import { parseFrame } from "./uplink/payload.js";
import { sendToNetwork } from "./uplink/uplink.js";
import { createFrameSplitter } from "./utils/framing.js";

/**
 * Forwards one complete frame to TagoIO and, for Class A devices, writes any
 * pending downlink back on the same socket. A frame without a usable serial is
 * logged and skipped so a single bad message never takes the server down.
 */
async function handleFrame(frame: string, socket: net.Socket) {
	const parsed = parseFrame(frame);
	if (!parsed) {
		console.warn(`Skipping frame without a serial: ${frame}`);
		return;
	}

	const device = await sendToNetwork(parsed.serial, parsed.value);
	if (!device) {
		return;
	}

	// Class A: the device is listening now (right after its uplink), so this is
	// the moment to deliver a pending downlink. Write the raw bytes to the socket.
	const downlink = await getPendingDownlink(device);
	if (downlink) {
		socket.write(downlink);
		console.info(
			`Downlink sent to serial ${parsed.serial} (${downlink.length} bytes)`,
		);
	}
}

const server = net.createServer((socket) => {
	// One splitter per connection: TCP may fragment or batch messages, so we
	// accumulate bytes and only act on complete, delimited frames.
	const splitter = createFrameSplitter(config.frameDelimiter);

	socket.on("data", (chunk) => {
		for (const frame of splitter.push(chunk)) {
			handleFrame(frame, socket).catch((error) =>
				console.error("Failed to handle frame:", error),
			);
		}
	});

	// If the connection closes while bytes are still buffered, the last message
	// never ended with FRAME_DELIMITER, so it was never processed. Warn instead
	// of dropping it silently, which otherwise looks like nothing happened.
	socket.on("close", () => {
		const unterminated = splitter.pending();
		if (unterminated) {
			console.warn(
				`Connection closed with an unterminated frame (missing FRAME_DELIMITER): ${unterminated}`,
			);
		}
	});

	socket.on("error", (error) => console.error("Socket error:", error));
});

server.on("error", (error) => {
	console.error("Server error:", error);
	process.exit(1);
});

server.listen(config.port, () => {
	console.info(`Middleware listening on port ${config.port}`);
});
