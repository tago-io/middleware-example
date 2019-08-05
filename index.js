const TagoConnector   = require('tago/connector');
const Device          = require('tago/device');
const net             = require('net');

// Establish connection with your connector at TagoIO.
const connector = new TagoConnector('CONNECTOR-TOKEN');

function parsePayload(payload) {
  const data_obj = {
    serial: payload.readUInt32LE(1),
    timestamp: payload.readUInt32LE(5),
    external_supply_voltage: payload.readUInt8(9) + (payload.readUInt8(10) * 0.01),
    supply_voltage: payload.readUInt8(11) + (payload.readUInt8(12) * 0.01),
    battery_voltage: payload.readUInt8(13) + (payload.readUInt8(14) * 0.01),
    temperature: payload.readInt8(15) + (payload.readUInt8(16) * 0.01),
    gsm_level: payload.readInt8(17),
  };

  return data_obj;
}

// Function which receive the buffer from the gateway.
async function dataReceive(msg) {
  // try to parse the data or console the error.
  let data_obj;
  try {
    data_obj = parsePayload(msg);
  } catch (e) {
    return console.log(e);
  }

  // Try to get the device token.
  // If you are not using the middleware for personal use, it's recommended for the buffer to contain
  // a Authorization generated in the user Account. You would send it in the second parameter
  // of this function.
  //
  // connector.resolveToken(data_obj.serial, data_obj.authorization).catch(console.log);
  //
  // In the way it is now, you can access ANY device with the serial from the connector, which are
  // opened to security issues.
  const token = await connector.resolveToken(data_obj.serial, undefined).catch(console.log);
  if (!token) {
    return console.log(`Token not found, serie: ${data_obj.serial}`);
  }

  // Insert data to TagoIO
  const device = new Device(token, false);
  device.insert(data_obj).then(console.log, console.log);
}

// Open the TCP/IP server.
// Buffer example for test purposes:
// 6d3930000088dd5a5c0b5e075c013d190300410120f14742ae4749414300
const server = net.createServer((socket) => {
  socket.on('data', dataReceive);
}).on('error', (err) => {
  throw err;
});

server.listen(3338);
console.info('Started Server at PORT', 3338);
