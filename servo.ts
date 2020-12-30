import rpio from "rpio";
import { clamp } from "lodash";

const servo1PwmPin = 32;

[
  "exit",
  "SIGINT",
  "SIGUSR1",
  "SIGUSR2",
  "uncaughtException",
  "SIGTERM",
].forEach((eventType) =>
  process.on(eventType, () => {
    rpio.pwmSetData(servo1PwmPin, 240);
    rpio.sleep(1);
    rpio.open(servo1PwmPin, rpio.INPUT);

    process.exit();
  })
);

export function init() {
  rpio.open(servo1PwmPin, rpio.PWM);
  rpio.pwmSetClockDivider(128);
  rpio.pwmSetRange(servo1PwmPin, 3000);
  rpio.pwmSetData(servo1PwmPin, 240);
}

// tilt: 240-560
export function tilt(beta: number) {
  beta = clamp(beta, 0, 90);
  const data = Math.round(240 + ((560 - 240) * beta) / 90);
  rpio.pwmSetData(servo1PwmPin, data);
}

// pan: left:1080 right:
export function pan(alpha: number) {
  console.log(`pan alpha: ${alpha}`);
}
