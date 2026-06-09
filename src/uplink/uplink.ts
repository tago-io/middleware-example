import { Device, Network } from "@tago-io/sdk";

import { config } from "../config.js";

/**
 * Resolves a device serial to a Device instance using the TagoIO SDK. The
 * middleware holds a Network token, so it first exchanges the serial for a
 * device token (Network.resolveToken), then builds a Device bound to it.
 * Same pattern as the template-middleware-http get-device helper.
 */
async function _resolveDevice(serial: string) {
	const network = new Network({ token: config.networkToken });

	const token = await network
		.resolveToken(serial, config.authorizationToken)
		.catch((error: unknown) => {
			// Pass serial as an argument instead of interpolating it: it comes from
			// device data and must not land in the format-string position.
			console.error(
				"Could not resolve device-token for serial %s:",
				serial,
				error,
			);
			return null;
		});

	if (!token) {
		return null;
	}

	return new Device({ token });
}

/**
 * Sends one raw payload to TagoIO using the SDK. The payload stays as a hex
 * string in the `payload` variable so the Connector's payload parser decodes it
 * into device variables (temperature, humidity, ...). Returns the resolved
 * Device so the caller can reuse it for a downlink without resolving the token
 * a second time, or null when the serial does not match any device.
 */
async function sendToNetwork(serial: string, payloadHex: string) {
	const device = await _resolveDevice(serial);
	if (!device) {
		return null;
	}

	await device
		.sendData({ variable: "payload", value: payloadHex })
		.then((result) => console.info("Data sent for serial %s:", serial, result))
		.catch((error: unknown) =>
			console.error("Send failed for serial %s:", serial, error),
		);

	return device;
}

export { sendToNetwork };
