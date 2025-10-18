import { readFileSync } from "fs"
import { dirname, join } from "path"
import { pathToFileURL } from "url"

type Constants = {
    formId: string
    email: string
    name: string
    role: string
    organization: string
    temperature: string
    hour_in: string
    mins_in: string
}

interface UserData {
  email: string;
  name: string;
  role: "Student" | "Teacher/Staff" | "Visitor";
  organization: string;
}

let constants: Constants | null = null
let entries: Record<string, UserData> = {}

async function submit(data: UserData) {
    if (!constants) return

    const now = new Date(Date.now());
    const hours = now.getHours();
    const mins = now.getMinutes();

    let formdata = {
        [constants.email]: data.email,
        [constants.name]: data.name,
        [constants.role]: data.role,
        [constants.organization]: data.organization,
        [constants.temperature]: "36.0",
        [constants.hour_in]: hours.toString(),
        [constants.mins_in]: mins.toString(),
    };

    try {
        const response = await fetch(
            `https://docs.google.com/forms/u/0/d/e/${constants.formId}/formResponse`,
            {
                method: "POST",
                headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams(formdata)
            }
        );

        return response.status == 200;
    } catch (e) {
        return false;
    }
}

export function config() {
    try {
        constants = JSON.parse(readFileSync(join(process.cwd(), "config", "constants.json")).toString())
        entries = JSON.parse(readFileSync(join(process.cwd(), "config", "db.json")).toString()).entries
        
        return true
    } catch (e) {
        console.log("Missing or invalid constants.json and/or db.json.")
        new Promise(res => setTimeout(res, 5000)).then(() => process.exit(0))

        return false
    }
}

export async function attendance(data: any) {
    const entry = (entries as Record<string, UserData>)[data]
    if (!entry) return {
        success: false,
        id: data,
        remarks: "ID does not match any student entry."
    }

    const success = await submit(entry)

    return success ? {
        success: true,
        id: data,
        name: entry.name,
        section: entry.organization,
        email: entry.email,
    } : {
        success: false,
        id: data,
        name: entry.name,
        section: entry.organization,
        email: entry.email,
        remarks: "Registration failed."
    }
}