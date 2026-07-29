import type { Device } from "@tago-io/sdk";

/**
 * Class A downlink: a device only listens right after it sends an uplink, so the
 * middleware checks for a pending downlink whenever a frame arrives and writes
 * it back on the same TCP socket.
 *
 * On TagoIO the downlink lives in a Configuration Parameter with key `downlink`.
 * `sent === false` ("Unread") means it has not been delivered yet. We read the
 * hex value, mark the parameter as read so it is not sent again, and return the
 * raw bytes for the caller to write to the socket. Returns null when there is
 * nothing to send.
 */
async function getPendingDownlink(device: Device) {
	const params = await device.getParameters("onlyUnRead").catch(() => []);

	const downlink = params.find(
		(param) => param.key === "downlink" && !param.sent,
	);
	if (!downlink?.value) {
		return null;
	}

	await device.setParameterAsRead(downlink.id).catch(() => null);

	return Buffer.from(downlink.value, "hex");
}

export { getPendingDownlink };
