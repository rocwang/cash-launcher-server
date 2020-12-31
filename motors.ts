import rpio from "rpio";
import { clamp } from "lodash";

const MOTOR_IN1_PIN = 36;
const MOTOR_IN2_PIN = 37;
const MOTOR_ENABLE_PIN = 31;

const TILT_SERVO_PWM_PIN = 32;
const TILT_PWM_DATA_BASE = 240;

const PAN_SERVO_PWM_PIN = 33;
const PAN_PWM_DATA_BASE = 630;

const PWM_RANGE = 3000;

[
  "exit",
  "SIGINT",
  "SIGUSR1",
  "SIGUSR2",
  "uncaughtException",
  "SIGTERM",
].forEach((eventType) =>
  process.on(eventType, () => {
    console.log(eventType);
    reset();

    rpio.sleep(1);

    [
      TILT_SERVO_PWM_PIN,
      PAN_SERVO_PWM_PIN,
      MOTOR_ENABLE_PIN,
      MOTOR_IN1_PIN,
      MOTOR_IN2_PIN,
    ].forEach((pin) => rpio.open(pin, rpio.INPUT));

    process.exit();
  })
);

export function init() {
  [TILT_SERVO_PWM_PIN, PAN_SERVO_PWM_PIN].forEach((pin) => {
    rpio.open(pin, rpio.PWM);
  });

  rpio.pwmSetClockDivider(128);

  [TILT_SERVO_PWM_PIN, PAN_SERVO_PWM_PIN].forEach((pin) => {
    rpio.pwmSetRange(pin, PWM_RANGE);
  });

  [MOTOR_IN1_PIN, MOTOR_IN2_PIN, MOTOR_ENABLE_PIN].forEach((pin) =>
    rpio.open(pin, rpio.OUTPUT)
  );

  reset();

  rpio.write(MOTOR_IN1_PIN, rpio.HIGH);
  rpio.write(MOTOR_IN2_PIN, rpio.LOW);
}

function reset() {
  resetServos();
  toggleMotor(false);

  rpio.write(MOTOR_IN1_PIN, rpio.LOW);
  rpio.write(MOTOR_IN2_PIN, rpio.LOW);
}

export function toggleMotor(state: boolean) {
  rpio.write(MOTOR_ENABLE_PIN, state ? rpio.HIGH : rpio.LOW);
}

function resetServos() {
  rpio.pwmSetData(TILT_SERVO_PWM_PIN, TILT_PWM_DATA_BASE);
  rpio.pwmSetData(PAN_SERVO_PWM_PIN, PAN_PWM_DATA_BASE);
}

// tilt: 0 degree: 240, 90 degrees: 560
export function tilt(beta: number) {
  beta = clamp(beta, 0, 90);
  const data = Math.round(
    TILT_PWM_DATA_BASE + ((560 - TILT_PWM_DATA_BASE) * beta) / 90
  );

  rpio.pwmSetData(TILT_SERVO_PWM_PIN, data);
}

// pan: +90 alpha -> 1060, -90 alpha -> 200, 0 alpha -> 630
// ios alpha: 0-360 degrees
// chrome: alpha: -180-180 degrees
// normalized to -180-108 degrees
export function pan(alpha: number) {
  alpha = alpha > 180 ? alpha - 360 : alpha;
  alpha = clamp(alpha, -90, +90);
  const data = Math.round(
    PAN_PWM_DATA_BASE + ((1060 - PAN_PWM_DATA_BASE) * alpha) / 90
  );

  rpio.pwmSetData(PAN_SERVO_PWM_PIN, data);
}
