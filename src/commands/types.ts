import type { ChatInputCommandInteraction } from "discord.js";

import type { User } from "../db/database.js";

export type BotCommand = {
    data: {
        name: string;
        toJSON: () => unknown;
    };
    requiresAuth?: boolean;
    execute: (
        interaction: ChatInputCommandInteraction,
        user?: User
    ) => Promise<void>;
};
