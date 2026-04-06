import { vi } from "vitest";

export function createMockInteraction(input?: {
    userId?: string;
    username?: string;
    options?: Record<string, number | null | undefined>;
    replied?: boolean;
    deferred?: boolean;
    client?: unknown;
    isAdmin?: boolean;
}) {
    const options = input?.options ?? {};

    return {
        user: {
            id: input?.userId ?? "discord-user-1",
            username: input?.username ?? "Case",
        },
        replied: input?.replied ?? false,
        deferred: input?.deferred ?? false,
        client:
            input?.client ??
            ({
                users: {
                    fetch: vi.fn(),
                },
            } as unknown),
        memberPermissions: {
            has: vi.fn().mockReturnValue(input?.isAdmin ?? false),
        },
        options: {
            getInteger: vi.fn((name: string, required?: boolean) => {
                const value = options[name];

                if (value === undefined && required) {
                    throw new Error(`Missing required option: ${name}`);
                }

                return value ?? null;
            }),
        },
        reply: vi.fn().mockResolvedValue(undefined),
        followUp: vi.fn().mockResolvedValue(undefined),
    };
}
