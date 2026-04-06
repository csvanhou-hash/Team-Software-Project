let botEnabled = true;

export function isBotEnabled() {
    return botEnabled;
}

export function canRunCommand(commandName: string) {
    return botEnabled || commandName === "enablebot";
}

export function setBotEnabled(enabled: boolean) {
    botEnabled = enabled;
}

export function resetBotState() {
    botEnabled = true;
}
