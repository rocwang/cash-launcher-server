# Cash Launcher Server

This is a WebSocket server that transforms the controlling data from
[the web client][client] to operate the cash launcher from Raspberry Pi.

It uses the [ws][ws] library to accept WebSocket connections from the client. It
has 2 endpoints: `/orientation` and `/velocity`. It transforms the device
orientation and swiping velocity sent from the client to [PWM][pwm] signals and
enabling signals, which are used to control the 2 servos and 1 motor connected
to Raspberry Pi. The low-level GPIO operations are handled by the [rpio][rpio]
package. rxjs is also used to help with the data transformation.

The server is secured using HTTPS, so a pair of key and certifications files
namely `key.pem` and `crt.pem` need to be put under the project root before
running the server.

The server also provides an HTTP endpoint `/siri`. When called. it makes the
motor on the cash launcher to work for 500ms.

[client]: https://github.com/rocwang/cash-launcher

[ws]: https://www.npmjs.com/package/ws

[pwm]: https://en.wikipedia.org/wiki/Pulse-width_modulation

[rpio]: https://www.npmjs.com/package/rpio
