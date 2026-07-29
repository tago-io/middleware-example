// TagoIO Connector payload parser (example).
//
// Paste this into your Connector's payload parser on TagoIO. It runs there, not
// in this middleware. The middleware forwards the raw hex as a `payload`
// variable; this parser decodes that hex into device variables.
//
// Example frame layout (replace with your device's real layout):
//   byte 0      type    0x01 = temperature, 0x02 = humidity
//   bytes 1..2  value   signed int16, big-endian, scaled by 1/100
//
// So "010929" -> type 0x01, value 0x0929 (2345) / 100 = 23.45 -> temperature
//    "02162E" -> type 0x02, value 0x162E (5678) / 100 = 56.78 -> humidity

const payloadItem = Array.isArray(payload)
  ? payload.find((item) => item.variable === "payload")
  : null;

if (payloadItem && payloadItem.value) {
  const bytes = Buffer.from(payloadItem.value, "hex");
  const type = bytes[0];
  const value = bytes.readInt16BE(1) / 100;

  if (type === 0x01) {
    payload = payload.concat({
      variable: "temperature",
      value,
      unit: "\xB0C",
    });
  } else if (type === 0x02) {
    payload = payload.concat({
      variable: "humidity",
      value,
      unit: "%",
    });
  }
}
