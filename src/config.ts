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
// Written in .env as an escaped sequence (default "\n"); decode it to raw bytes.
const frameDelimiter = Buffer.from(
	(process.env.FRAME_DELIMITER ?? "\\n")
		.replace(/\\n/g, "\n")
		.replace(/\\r/g, "\r"),
);

const config = {
	networkToken: required("NETWORK_TOKEN"),
	authorizationToken: required("AUTHORIZATION_TOKEN"),
	apiUrl: process.env.TAGO_API_URL ?? "https://api.us-e1.tago.io",
	port: Number(process.env.PORT ?? 3338),
	frameDelimiter,
};

export { config };
