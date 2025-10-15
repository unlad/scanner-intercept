import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline"
import express, { json } from "express"
import extend from "express-ws"

import { attendance, loadEntries } from "./attendance";

const { app: server, getWss } = extend(express().use(json()))

let port: SerialPort | null = null
let parser: ReadlineParser | null = null
let previous: string | null = null

function broadcast(data: Record<string, any>) {
    getWss().clients.forEach(socket => socket.send(
        JSON.stringify(data)
    ))
}

server.get("/list", async (req, res) => {
    const ports = await SerialPort.list()
    res.send(ports)
})

server.post("/select", async (req, res) => {
    if (req.body.path) {
        if (req.body.path == port?.path) return res.send("OK")

        port = new SerialPort({ path: req.body.path, baudRate: 9600, lock: false })
        parser = port.pipe(new ReadlineParser({ delimiter: "\r" }))

        parser.on("data", (data) => {
            if (data == previous) return
            previous = data
            
            let processed = attendance(data)
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

        broadcast({ type: "state", active: true })
        parser.emit("data", "12-3456-789")
    } else {
        port?.destroy()
        parser?.destroy()
    }

    res.send("OK")
})

server.ws("/listen", (ws) => {
    ws.send(JSON.stringify({ type: "state", active: !!port }))
})

loadEntries().then(() => {
    console.log("Loaded entries")
})

server.listen(4567, () => {
    console.log(`Listening at port 4567`)
})