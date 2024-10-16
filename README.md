# controlled-proxy

![controlled-proxy](https://github.com/karmaniverous/controlled-proxy/raw/main/assets/controlled-proxy.png)

**_`controlledProxy` allows the behavior of any object to be modified & controlled non-destructively at runtime._**

<!-- TYPEDOC_EXCLUDE -->

> [API Documentation](https://docs.karmanivero.us/controlled-proxy/) • [CHANGELOG](https://github.com/karmaniverous/controlled-proxy/tree/main/CHANGELOG.md)

<!-- /TYPEDOC_EXCLUDE -->

## Installation

```bash
npm install @karmaniverous/controlled-proxy
```

## Basic Usage

The `controlledProxy` function creates a type-safe proxy of any `object`.

The [`options`](https://docs.karmanivero.us/controlled-proxy/interfaces/ControlledProxyOptions.html) parameter is an object with the following properties:

| Property                       | Type                                                                                                     | Default           | Description                                                                                                                                                                                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultControls`              | `Record<PropertyKey, boolean>`                                                                           | `{}`              | A map of controlled property keys to boolean values. When this value is `true` or the property is uncontrolled, the property will behave normally. When this value is false, the property will execute the disabled member handler or return `undefined`. |
| `defaultDisabledMemberHandler` | [`DisabledMemberHandler`](https://docs.karmanivero.us/controlled-proxy/types/DisabledMemberHandler.html) | `() => undefined` | A function that is called when a disabled controlled property is accessed.                                                                                                                                                                                |
| `target`                       | `object`                                                                                                 | _required_        | The object to proxy.                                                                                                                                                                                                                                      |

```ts
import { controlledProxy } from '@karmaniverous/controlled-proxy';

// Create a controlled console logger. Info messages are disabled by default.
const controlledConsoleLogger = controlledProxy({
  defaultControls: { debug: true, info: false },
  target: console,
});

// Log messages.
controlledConsoleLogger.debug('debug log');
controlledConsoleLogger.info('info log');
// > debug log
```

## Runtime Control

The proxy object has two special properties, keyed with symbols that can be imported from the package:

| Property                      | Type                                                                                                     | Description                                                                                                                                                                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[controlProp]`               | `Record<PropertyKey, boolean>`                                                                           | A map of controlled property keys to boolean values. When this value is `true` or the property is uncontrolled, the property will behave normally. When this value is false, the property will execute the disabled member handler or return `undefined`. |
| `[disabledMemberHandlerProp]` | [`DisabledMemberHandler`](https://docs.karmanivero.us/controlled-proxy/types/DisabledMemberHandler.html) | A function that is called when a disabled controlled property is accessed. Defaults to `() => undefined`.                                                                                                                                                 |

```ts
import {
  controlledProxy,
  controlProp,
  disabledMemberHandlerProp,
} from '@karmaniverous/controlled-proxy';

// Create a controlled console logger. Info messages are disabled by default.
const controlledConsoleLogger = controlledProxy({
  defaultControls: { debug: true, info: false },
  target: console,
});

// Disable debug messages & enable info messages at runtime.
controlledConsoleLogger[controlProp].debug = false;
controlledConsoleLogger[controlProp].info = true;

// Log messages.
controlledConsoleLogger.debug('debug log');
controlledConsoleLogger.info('info log');
// > info log

// Change the disabled member handler.
controlledConsoleLogger[disabledMemberHandlerProp] = (
  target: Console,
  prop: PropertyKey,
) => target.log(`Accessed disabled member: ${prop.toString()}`);

// Log messages again.
controlledConsoleLogger.debug('debug log');
controlledConsoleLogger.info('info log');
// > Accessed disabled member: debug
// > info log
```

## Proxy Injection

Here's the real power of the library: let's inject a controlled proxy into a class!

```ts
import { controlledProxy, controlProp } from '@karmaniverous/controlled-proxy';';

// Create a class that accepts a proxied logger as a constructor argument.
class MyClass {
  // Proxied logger must be compatible with console.debug & console.info.
  constructor(private logger: Pick<Console, 'debug' | 'info'>) {}

  // Exercise the proxied logger.
  myMethod() {
    this.logger.debug('debug log');
    this.logger.info('info log');
  }
}

// Create a controlled console logger, with all messages enabled by default
// and a custom disabled member handler.
const controlledConsoleLogger = controlledProxy({
  defaultControls: { debug: false, info: true },
  defaultDisabledMemberHandler: (target: Console, prop: PropertyKey) =>
    target.log(`Accessed disabled member: ${prop.toString()}`),
  target: console,
});

// Instantiate the class with the controlled console logger.
const myConsoleInstance = new MyClass(controlledConsoleLogger);

// Disable console debug messages at runtime.
controlledConsoleLogger[controlProp].debug = false;

// Exercise the proxied console logger from within the class.
myConsoleInstance.myMethod();
// > Accessed disabled member: debug
// > info log

// Create an equivalent controlled winston logger, with all messages enabled by
// default and a custom disabled member handler.
import { createLogger, type Logger } from 'winston';

const controlledWinstonLogger = controlledProxy({
  defaultControls: { debug: true, info: true },
  defaultDisabledMemberHandler: (target: Logger, prop: PropertyKey) =>
    target.log('warn', `Accessed disabled member: ${prop.toString()}`),
  target: createLogger(),
});

// Instantiate the class again with the controlled winston logger.
const myWinstonInstance = new MyClass(controlledWinstonLogger);

// Disable winston debug messages at runtime.
controlledWinstonLogger[controlProp].debug = false;

// Exercise the proxied winston logger from within the class.
myWinstonInstance.myMethod();
// > [winston] { "level":"warn", "message":"Accessed disabled member: debug" }
// > [winston] { "level":"info", "message":"info log" }
```

---

Built for you with ❤️ on Bali! Find more great tools & templates on [my GitHub Profile](https://github.com/karmaniverous).
