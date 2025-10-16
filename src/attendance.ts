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

let entries: Record<string, UserData> = {}

// @ts-ignore
let constants: Constants

async function submit(data: UserData, temperature: number) {
    const now = new Date(Date.now());
    const hours = now.getHours();
    const mins = now.getMinutes();

    let formdata = {
        [constants.email]: data.email,
        [constants.name]: data.name,
        [constants.role]: data.role,
        [constants.organization]: data.organization,
        [constants.temperature]: temperature.toFixed(1),
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

export async function load() {
    // @ts-ignore
    entries = (await import("../db.json")).entries
    
    // @ts-ignore
    constants = (await import("../constants.js")).default
}

export async function attendance(data: any) {
    const entry = entries[data]
    if (!entry) return {
        success: false,
        id: data,
        remarks: "ID does not match any student entry."
    }

    const success = await submit(entry, 36.0)

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