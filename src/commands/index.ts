import { buyDetergentCommand } from "./buyDetergent.js";
import { disableBotCommand } from "./disableBot.js";
import { doLaundryCommand } from "./doLaundry.js";
import { enableBotCommand } from "./enableBot.js";
import { finishLaundryCommand } from "./finishLaundry.js";
import { laundryStatisticsCommand } from "./laundryStatistics.js";
import { moveLaundryCommand } from "./moveLaundry.js";
import { pingCommand } from "./ping.js";
import { registerCommand } from "./register.js";
import { setDryerTimeCommand } from "./setDryerTime.js";
import { setWasherTimeCommand } from "./setWasherTime.js";

export const commands = [
    pingCommand,
    registerCommand,
    enableBotCommand,
    disableBotCommand,
    setWasherTimeCommand,
    setDryerTimeCommand,
    buyDetergentCommand,
    laundryStatisticsCommand,
    doLaundryCommand,
    moveLaundryCommand,
    finishLaundryCommand,
];
