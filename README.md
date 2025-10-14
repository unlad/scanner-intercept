[![Latest Release](https://img.shields.io/github/v/release/unlad/scanner-intercept)](https://github.com/unlad/scanner-intercept/releases/latest)

# Overview
This program handles incoming data streams from a barcode scanner connected via a Virtual COM Port (VCP), then
processes and sends the data to connected WebSocket clients running on an Express server.

# Download
See the latest release [here](https://github.com/unlad/scanner-intercept/releases/latest).

# API
The API binds to the port `4567`.

## `GET /list`
Lists all available devices.

## `POST /select`
Requires a JSON body with `path` paramter (from `GET /list`).  
Intercepts data from the selected COM port.

## `WS /listen`
Receive processed data from the connected COM port.