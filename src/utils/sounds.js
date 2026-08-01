const beep = new Audio("/sounds/beep.mp3");

export function playBeep() {
    beep.currentTime = 0;
    beep.play().catch(() => {});
}