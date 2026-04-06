import { describe, expect, it } from "vitest";

import { buildLaundryStatusText, formatDuration } from "../src/utils/formatting.js";

describe("laundry status formatting", () => {
    it("formatDuration formats readable durations", () => {
        expect(formatDuration(1800)).toBe("30m 0s");
        expect(formatDuration(2710)).toBe("45m 10s");
        expect(formatDuration(3661)).toBe("1h 1m 1s");
    });

    it("buildLaundryStatusText shows the washer timer when only the washer is running", () => {
        const status = buildLaundryStatusText(
            {
                id: 1,
                user_id: 1,
                total_loads: 2,
                washer_time_seconds: 1800,
                dryer_time_seconds: 2700,
                loads_started_in_washer: 1,
                loads_moved_to_dryer: 0,
                dryer_loads_completed: 0,
                washer_running: 1,
                dryer_running: 0,
                washer_ends_at: "2026-04-06T12:30:00.000Z",
                dryer_ends_at: null,
                awaiting_move: 0,
                awaiting_finish: 0,
                created_at: "2026-04-06T12:00:00.000Z",
            },
            new Date("2026-04-06T12:00:00.000Z").getTime()
        );

        expect(status).toBe("Washer: 30m 0s remaining.");
    });

    it("buildLaundryStatusText shows both timers when washer and dryer are running", () => {
        const status = buildLaundryStatusText(
            {
                id: 1,
                user_id: 1,
                total_loads: 3,
                washer_time_seconds: 1800,
                dryer_time_seconds: 2710,
                loads_started_in_washer: 2,
                loads_moved_to_dryer: 1,
                dryer_loads_completed: 0,
                washer_running: 1,
                dryer_running: 1,
                washer_ends_at: "2026-04-06T12:30:00.000Z",
                dryer_ends_at: "2026-04-06T12:45:10.000Z",
                awaiting_move: 0,
                awaiting_finish: 0,
                created_at: "2026-04-06T12:00:00.000Z",
            },
            new Date("2026-04-06T12:00:00.000Z").getTime()
        );

        expect(status).toBe("Washer: 30m 0s remaining. Dryer: 45m 10s remaining.");
    });
});
