import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline"
import express, { json } from "express"
import extend from "express-ws"

const { app: server, getWss } = extend(express().use(json()))

let port: SerialPort | null = null
let parser: ReadlineParser | null = null
let previous: string = ""

server.get("/list", async (req, res) => {
    const ports = await SerialPort.list()
    res.send(ports)
})

server.post("/select", async (req, res) => {
    if (req.body.path) {
        port = new SerialPort({ path: req.body.path, baudRate: 9600 })
        parser = port.pipe(new ReadlineParser({ delimiter: "\r" }))

        parser.on("data", (data) => {
            if (data == previous) return

            previous = data
            getWss().clients.forEach(socket => socket.send(data))
        })

        port.on("close", () => {
            port = null
        })

        port.on("error", () => {
            port = null
        })

        parser.on("close", () => {
            parser = null
        })
    } else {
        port?.destroy()
        parser?.destroy()
    }

    res.send("OK")
})

server.ws("/listen", () => {})

server.listen(4567, () => {
    console.log(`Listening at port 4567`)
})