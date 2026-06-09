import "dotenv/config";

// Reads and validates configuration from the environment once at startup.
// Required tokens fail fast with a clear message so the server never starts in a
// state where every request would be rejected by TagoIO.

/**
 * Reads a required environment variable, throwing a clear error when it is
 * missing so the server fails fast instead of running with rejected requests.
 */
const required = (name: string) => {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
};

// Frame delimiter that marks the end of one device message in the TCP stream.
// Written in .env as an escaped sequence (default "\n"); decode it to the real
// characters. Frames are text, so the splitter works on strings directly.
const frameDelimiter = (process.env.FRAME_DELIMITER ?? "\\n")
	.replace(/\\n/g, "\n")
	.replace(/\\r/g, "\r");

const config = {
	networkToken: required("NETWORK_TOKEN"),
	authorizationToken: required("AUTHORIZATION_TOKEN"),
	apiUrl: process.env.TAGO_API_URL ?? "https://api.us-e1.tago.io",
	port: Number(process.env.PORT ?? 3338),
	frameDelimiter,
	// Cap on buffered bytes for a single frame. A device that never sends the
	// delimiter would otherwise grow the buffer until the process runs out of
	// memory; past this size the connection is dropped instead.
	maxFrameLength: Number(process.env.MAX_FRAME_LENGTH ?? 65536),
};

export { config };
