let entries: Record<string, any> = {}

export async function loadEntries() {
    entries = (await import("../db.json")).entries
}

export function attendance(data: any) {
    const entry = entries[data]
    if (!entry) return {
        success: false,
        id: data,
        remarks: "ID does not match any student entry."
    }

    return {
        success: true,
        id: data,
        name: entry.id,
        section: entry.section,
        email: entry.email,
    }
}