# TagoIO Middleware Example

A small TCP middleware that receives raw device payloads, reads the device serial
from the payload, and forwards the raw payload to TagoIO using the official
`@tago-io/sdk`. TagoIO routes the data to the matching device and decodes it with
the Connector's payload parser. For Class A devices, the middleware also delivers
a pending downlink back to the device on the same TCP connection.

Use this repository as a starting point: clone it, adjust the payload handling
for your device, set your tokens, and run it with pnpm, pm2, or Docker.

## How it works

1. The middleware listens for raw bytes on a TCP port and splits the stream into
   complete frames on a delimiter (default newline). TCP is a byte stream, so it
   buffers partial frames and splits batched ones (see `src/utils/framing.ts`).
   A peer that never sends the delimiter would grow the buffer without bound, so
   a frame larger than `MAX_FRAME_LENGTH` drops the connection.
2. Each complete frame is passed to `parseFrame` (see `src/utils/payload.ts`),
   which returns the device `serial` (a string, any format) and the `value` to
   send. The default expects a text frame `serial,value`.
3. It uses the SDK to resolve the serial into a device token
   (`Network.resolveToken`) and sends `{ variable: "payload", value: "<value>" }`
   with `Device.sendData` (see `src/uplink/tagoio.ts`).
4. The Connector's payload parser decodes the hex `payload` value into the final
   device variables (temperature, humidity, ...).
5. Right after the uplink, the middleware checks the device's Configuration
   Parameters for a pending `downlink` and, if present, writes its bytes back on
   the same socket (see `src/downlink/tagoio.ts`).

The decoding lives on TagoIO, not in this code. This middleware frames the
stream, transports the payload, and relays downlinks.

## TagoIO setup

Do this on TagoIO before running the middleware. The order matters.

### 1. Create the Network

Go to https://admin.tago.io/networks and create a Network with Serial Number enabled.

See the documentation for reference: https://docs.tago.io/docs/tagoio/integrations/general/creating-a-network-integration

### 2. Generate the Network token

Open the Network's **Tokens** section and generate a token. This is your
`NETWORK_TOKEN`. 

You also need an **Authorization token** for the Network, used
to resolve the device serial (`AUTHORIZATION_TOKEN`). 

See the documentation for reference: https://docs.tago.io/docs/tagoio/integrations/general/authorization/

### 3. Create the Connector

Create a Connector associated with the Network from step 1. 

Add the device payload parser to the **Connector**: this is what decodes the hex `payload` value
into your final device variables. A ready-to-paste example that decodes
temperature and humidity lives in [`examples/payload-parser.js`](examples/payload-parser.js).

See the documentation: https://docs.tago.io/docs/tagoio/devices/payload-parser/

### 4. Create a device

Create a device using your Connector, with the serial you will send in your
tests. The serial sent in the frame must match this device.

## Configuration

Copy the example env file and fill in your tokens:

```bash
cp .env.example .env
```

| Variable              | Required | Default                     | Description                              |
|-----------------------|----------|-----------------------------|------------------------------------------|
| `NETWORK_TOKEN`       | yes      |                             | Network token used by the SDK            |
| `AUTHORIZATION_TOKEN` | yes      |                             | Authorization token, used to resolve the serial |
| `TAGO_API_URL`        | no       | `https://api.us-e1.tago.io` | API base URL for your account region     |
| `PORT`                | no       | `3338`                      | TCP port the middleware listens on       |
| `FRAME_DELIMITER`     | no       | `\n`                        | Byte sequence marking the end of a frame |
| `MAX_FRAME_LENGTH`    | no       | `65536`                     | Max bytes buffered for one frame before the connection is dropped |

The middleware fails to start if a required variable is missing.

## Connector payload parser

The middleware forwards the raw hex as a `payload` variable. The Connector
decodes it into device variables. [`examples/payload-parser.js`](examples/payload-parser.js)
is a working example that decodes two message types using this layout:

| byte 0 (type) | bytes 1..2 (value)             | variable      |
|---------------|--------------------------------|---------------|
| `0x01`        | signed int16 big-endian / 100  | `temperature` |
| `0x02`        | signed int16 big-endian / 100  | `humidity`    |

Replace it with your device's real layout. The two test frames below match this
example so you can see the full path end to end.

## Downlink (Class A)

For Class A devices, TagoIO can only reach the device right after it sends an
uplink. The middleware reads the downlink from the device's Configuration
Parameters and writes it back on the same TCP connection.

1. Open your device on TagoIO and go to the **Configuration Parameters** tab.
2. Create a parameter with key `downlink` and the hex payload as its value.
3. Leave the parameter **Unread** (`sent = false`).

On the next uplink from that device, the middleware reads the `downlink`
parameter, writes its bytes back on the socket, logs
`Downlink sent to serial <serial>`, and marks the parameter as read so it is not
sent again.

## Running

Requires Node.js 24 or newer and pnpm. Install dependencies first:

```bash
pnpm install
```

### Development

Runs from TypeScript source and reloads on change:

```bash
pnpm dev
```

### Production with Node

Build to `dist/` and run the compiled output:

```bash
pnpm build
pnpm start
```

### Production with pm2

pm2 keeps the middleware running unattended, restarting it on crash. Install
pm2 globally (with npm, which avoids pnpm's global bin PATH setup), build, then
start with the committed config:

```bash
# Make sure pm2 is installed
pnpm build
pm2 start ecosystem.config.cjs
pm2 logs middleware-example
```

### Docker

Build and run with environment from your `.env` file. Publish the same port the
app listens on, taking it from `PORT` in your `.env` (default `3338`) so the
mapping matches what the middleware binds inside the container:

```bash
docker build -t middleware-example .
docker run --env-file .env -p "${PORT:-3338}:${PORT:-3338}" middleware-example
```

Or with Docker Compose:

```bash
docker compose up --build
```

## Verifying it works

1. Start the middleware with any of the methods above. You should see
   `Middleware listening on port 3338`.
2. Send a test frame over TCP. The examples below use `nc` (netcat). It ships by
   default on macOS, but many Linux distributions do not included.

   The default `parseFrame` expects `serial,value` ending with the delimiter
   (`\n`). The frames below use serial `70-B3-D5-7E-D0-12-34-56`, so create a
   device with that serial (or change it to match your device).

   Temperature (`010929` decodes to `23.45 C` with the example parser):

   ```bash
   printf '70-B3-D5-7E-D0-12-34-56,010929\n' | nc localhost 3338
   ```

   Humidity (`02162E` decodes to `56.78 %` with the example parser):

   ```bash
   printf '70-B3-D5-7E-D0-12-34-56,02162E\n' | nc localhost 3338
   ```

3. On success the middleware logs `Data sent for serial 70-B3-D5-7E-D0-12-34-56`.
4. Open your device on TagoIO (https://admin.tago.io/devices) and check the data
   tab. The raw payload arrives there and the Connector parser turns it into
   `temperature` / `humidity` variables.
5. To test a downlink, add a `downlink` Configuration Parameter (see the section
   above), then send another frame. The bytes are written back to the `nc`
   session and the middleware logs `Downlink sent to serial ...`.

### Troubleshooting

- `Could not resolve device-token for serial ...`: the serial does not match any
  device on the Network, or the `AUTHORIZATION_TOKEN` is wrong. Confirm the
  device exists with that serial and uses the Connector tied to your Network.
- `Skipping frame without a serial`: `parseFrame` returned null (the default
  needs a `serial,value` text frame). Check what your device sends, or adjust
  `parseFrame`.
- `Connection closed with an unterminated frame (missing FRAME_DELIMITER)`: the
  message arrived without the trailing delimiter, so it was never processed. This
  is the usual cause when `printf` is missing the `\n`. Terminate each message
  with `FRAME_DELIMITER`.
- `Dropping connection: ... Frame exceeded maxFrameLength`: a frame grew past
  `MAX_FRAME_LENGTH` without a delimiter, so the connection was closed. Usually
  the device is not sending `FRAME_DELIMITER`; confirm the delimiter matches, or
  raise `MAX_FRAME_LENGTH` if your frames are legitimately larger.
- No data on the device: confirm the device serial matches and that the device
  uses the Connector tied to your Network.
- Docker requests never reach the middleware: the published port must match
  `PORT` from your `.env`. The app binds `PORT` inside the container, so
  `docker run -p 3338:3338` only works when `PORT=3338`. Use
  `-p "${PORT}:${PORT}"`, or `docker compose up` which already maps it for you.

## Adapting to your device

Two places control how raw bytes become a TagoIO payload:

- **`src/utils/payload.ts` (`parseFrame`)**: the one function you edit. It takes
  a complete frame and returns `{ serial, value }`. The default reads a text
  frame `serial,value`, so the serial is a string in any format: a number, a hex
  string, a MAC like `70-B3-D5-7E-D0-12-34-56`, an IMEI. For a binary protocol,
  read the serial and value out of the bytes instead. Return `null` to skip a
  frame.
- **`FRAME_DELIMITER`**: how the stream is split into frames. Set it to whatever
  ends one message from your device. If your device uses length-prefixed frames
  instead of a delimiter, replace `src/utils/framing.ts` with that logic.

The rest of the flow (TCP server, forwarding to TagoIO, downlink relay) stays the
same.

## Tests

```bash
pnpm test
```

The tests cover the pure functions (serial extraction and frame splitting) in
`src/utils/`.
