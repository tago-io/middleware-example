# Creating your Connector at TagoIO.

First you need to have a connector created at your account on TagoIO.

1. Enter the connector page: https://admin.tago.io/connector
2. Create a new connector.
3. Setup a Name, a Short Description and a Category. Any other field is up to you.
4. Create the Middleware.
5. Refresh the page. As this page is experimental, you can have issues if not refresh after saving.
6. Go to the Tokens section page and generate a new TOKEN.
7. Copy the Token and replace the CONNECTOR-TOKEN in this code.

The Connector Token give access to any device created using your Token. You can parent new connector to your connector in order to use the same token if you need different setups and don't need to have multiple middlewares.

# How to Test it

First you must create a Device using the connector you've just created.

1. Go to the Devices Page: https://admin.tago.io/devices/connectors
2. Enter the category you choosed for your connector.
3. Create the Device with a Serial Code you will use in your tests.

Now you just need to get the middleware running and start sending data.

# How to setup this middleware.

This code uses Node.JS programming language.

Open [Node.js Installation Guide](https://nodejs.org/en/download/package-manager/) for instructions on how to install NPM and Node.js.

1. Open your favorite command-line tool like the Windows Command Prompt, PowerShell, Cygwin, Bash or the Git shell (which is installed along with Github for Windows).  Then create or navigate to your new project folder.

2. Now you must install Tago SDK. Enter in your command-line npm install. This will start the installation of the TagoIO SDK.

3. Just run your middleware by using `npm start` or `node index.js`
