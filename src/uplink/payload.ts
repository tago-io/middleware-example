interface ParsedFrame {
	serial: string;
	value: string;
}

const SEPARATOR = ",";

/**
 * Turns one complete device frame into the two values TagoIO needs: the device
 * serial (a string, any format) and the payload to send as `value`.
 *
 * THIS IS THE FUNCTION YOU EDIT FOR YOUR DEVICE. The default expects a text
 * frame "serial,value" (for example "70-B3-D5-7E-D0-12-34-56,41BC7E1F2A"), which
 * keeps the serial in whatever format your device uses: a number, a hex string,
 * a MAC, an IMEI. Change it to match your protocol, or return null to skip a
 * frame that does not contain a usable serial and value.
 */
function parseFrame(frame: string): ParsedFrame | null {
	const separatorIndex = frame.indexOf(SEPARATOR);
	if (separatorIndex === -1) {
		return null;
	}

	const serial = frame.slice(0, separatorIndex).trim();
	const value = frame.slice(separatorIndex + 1).trim();

	if (!serial || !value) {
		return null;
	}

	return { serial, value };
}

export { parseFrame };
