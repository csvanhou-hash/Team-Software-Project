import { describe, expect, it, vi } from "vitest";

import { createUser, updateUser } from "../src/db/database.js";
import { runReminderCheck } from "../src/services/reminderService.js";

describe("reminder service", () => {
    it("user with no last_laundry_at gets a laundry reminder", async () => {
        createUser("discord-reminder-1", "Case");
        const send = vi.fn().mockResolvedValue(undefined);
        const client = {
            users: {
                fetch: vi.fn().mockResolvedValue({ send }),
            },
        };

        await runReminderCheck(client as never);

        expect(send).toHaveBeenCalledWith(
            expect.stringContaining("Laundry reminder: it has been a while since your last laundry day.")
        );
    });

    it("user with old laundry and old detergent gets both reminders in one message", async () => {
        const user = createUser("discord-reminder-2", "Case");
        updateUser(user.id, {
            lastLaundryAt: "2026-03-01T00:00:00.000Z",
            lastBoughtDetergentAt: "2026-02-01T00:00:00.000Z",
        });
        const send = vi.fn().mockResolvedValue(undefined);
        const client = {
            users: {
                fetch: vi.fn().mockResolvedValue({ send }),
            },
        };

        await runReminderCheck(client as never);

        const message = send.mock.calls[0]?.[0];

        expect(message).toContain("Laundry reminder");
        expect(message).toContain("Detergent reminder");
    });

    it("user with recent laundry and recent detergent does not get a reminder", async () => {
        const user = createUser("discord-reminder-3", "Case");
        updateUser(user.id, {
            lastLaundryAt: new Date().toISOString(),
            lastBoughtDetergentAt: new Date().toISOString(),
        });
        const fetch = vi.fn().mockResolvedValue({
            send: vi.fn().mockResolvedValue(undefined),
        });
        const client = {
            users: {
                fetch,
            },
        };

        await runReminderCheck(client as never);

        expect(fetch).not.toHaveBeenCalled();
    });

    it("user with no detergent history gets a detergent reminder", async () => {
        const user = createUser("discord-reminder-4", "Case");
        updateUser(user.id, {
            lastLaundryAt: new Date().toISOString(),
        });
        const send = vi.fn().mockResolvedValue(undefined);
        const client = {
            users: {
                fetch: vi.fn().mockResolvedValue({ send }),
            },
        };

        await runReminderCheck(client as never);

        expect(send).toHaveBeenCalledWith(
            "Detergent reminder: you may want to buy detergent soon."
        );
    });

    it("DM failure during reminders does not crash the reminder run", async () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        createUser("discord-reminder-5", "Case");
        const client = {
            users: {
                fetch: vi.fn().mockRejectedValue(new Error("DM closed")),
            },
        };

        await expect(runReminderCheck(client as never)).resolves.toBeUndefined();
        expect(errorSpy).toHaveBeenCalled();
    });
});
