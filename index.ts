import { Network, Device } from "@tago-io/sdk";
import * as net from "net";
const PORT = 3338;

const network = new Network({ token: "" });

function parsePayload(payload: Buffer) {

  const data = [
    {
      variable: "serial",
      value: payload.readUInt32LE(1),
    },
    {
      variable: "timestamp",
      value: payload.readUInt32LE(5),
    },
    {
      variable: "external_supply_voltage",
      value: payload.readUInt8(9) + payload.readUInt8(10) * 0.01,
    },
    {
      variable: "supply_voltage",
      value: payload.readUInt8(11) + payload.readUInt8(12) * 0.01,
    },
    {
      variable: "battery_voltage",
      value: payload.readUInt8(13) + payload.readUInt8(14) * 0.01,
    },
    {
      variable: "temperature",
      value: payload.readInt8(15) + payload.readUInt8(16) * 0.01,
    },
    {
      variable: "gsm_level",
      value: payload.readInt8(17),
    },
  ];

  return data;
}

async function dataReceived(msg: Buffer) {
  const data = parsePayload(msg);
  console.info("data ", data);
  const serial = data.find((e) => e.variable == "serial")?.value.toString();

  if (!serial) {
    return console.log(`Serial not found`);
  }

  const token = await network.resolveToken(serial).catch(() => null);
  if (!token) {
    return console.log(`Token not found, serie: ${serial}`);
  }

  const device = new Device({ token });
  device.sendData(data).then(console.log, console.log);
}

const server = net
  .createServer((socket) => {
    socket.on("data", dataReceived);
  })
  .on("error", (err) => {
    throw err;
  });

server.listen(PORT);
console.info("Started Server at PORT", PORT);
