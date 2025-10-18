import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline"
import express, { json } from "express"
import extend from "express-ws"

import { attendance, config } from "./attendance";

const { app: server, getWss } = extend(express().use(json()))

let port: SerialPort | null = null
let parser: ReadlineParser | null = null
let previous: string | null = null

function broadcast(data: Record<string, any>) {
    getWss().clients.forEach(socket => socket.send(
        JSON.stringify(data)
    ))
}

function select(path?: string) {
    console.log(`new path: ${path}`)
    if (path && path !== "") {
        if (path == port?.path) return

        port = new SerialPort({ path, baudRate: 9600, lock: false })
        parser = port.pipe(new ReadlineParser({ delimiter: "\r" }))

        parser.on("data", async (data) => {
            if (data == previous) return
            previous = data
            
            let processed = await attendance(data)
            broadcast({ type: "data", data: processed })
        })

        port.on("error", (err) => {
            console.log(`Port Error: ${err}`)
            broadcast({ type: "error", source:"port", err })
        })

        parser.on("error", (err) => {
            console.log(`Parser Error: ${err}`)
            broadcast({ type: "error", source:"parser", err })
        })

        port.on("close", () => {
            port = null
            broadcast({ type: "state", active: false })
        })

        broadcast({ type: "state", active: true, path })
    } else {
        port?.destroy()
        parser?.destroy()
    }
}

server.get("/list", async (req, res) => {
    const ports = await SerialPort.list()
    res.send(ports)
})

server.post("/select", async (req, res) => {
    select(req.body.path)
    res.send("OK")
})

server.ws("/listen", (ws) => {
    ws.send(JSON.stringify({ type: "state", active: !!port, path: port?.path }))
})

config() && server.listen(4567, () => {
    console.log(`Listening at port 4567`)

    setInterval(async () => {
        if (!port) {
            const ports = await SerialPort.list()
            const filtered = ports.filter(p => 
                (p.locationId || p.pnpId)
                && p.manufacturer
                && p.productId
                && p.serialNumber
                && p.vendorId
            )

            if (filtered.length) select(filtered[0]?.path)
        }
    }, 1000)
})

