# controlled-proxy

![controlled-proxy](/assets/controlled-proxy.png)

`controlledProxy` allows the behavior of any object to be modified & controlled non-destructively at runtime.

<!-- TYPEDOC_EXCLUDE -->

> [API Documentation](https://docs.karmanivero.us/controlled-proxy/) • [CHANGELOG](https://github.com/karmaniverous/controlled-proxy/tree/main/CHANGELOG.md)

<!-- /TYPEDOC_EXCLUDE -->

## Installation

```bash
npm install @karmaniverous/controlled-proxy
```

## Usage

<!-- prettier-ignore-start -->
```ts
import {
  controlledProxy,
  controlProp,
  disabledMemberHandlerProp,
} from '@karmaniverous/controlled-proxy';

const controlledConsole = controlledProxy({
  defaultControls: { debug: true, info: false },
  target: console,
});

// Info messages are disabled by default.
controlledConsole.debug('debug log'); // > debug log
controlledConsole.info('info log');   // >

// Disable debug messages & enable info messages.
controlledConsole[controlProp].debug = false;
controlledConsole[controlProp].info = true;

// Try again.
controlledConsole.debug('debug log'); // >
controlledConsole.info('info log');   // > info log

// Change the disabled member handler.
controlledConsole[disabledMemberHandlerProp] = (target, prop) =>
  target.log(`Accessed disabled member: ${prop.toString()}`);

// One more time.
controlledConsole.debug('debug log'); // > Accessed disabled member: debug
controlledConsole.info('info log');   // > info log
```
<!-- prettier-ignore-end -->

---

Built for you with ❤️ on Bali! Find more great tools & templates on [my GitHub Profile](https://github.com/karmaniverous).
