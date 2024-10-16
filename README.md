# controlled-proxy

![controlled-proxy](/assets/controlled-proxy.png)

**_`controlledProxy` allows the behavior of any object to be modified & controlled non-destructively at runtime._**

<!-- TYPEDOC_EXCLUDE -->

> [API Documentation](https://docs.karmanivero.us/controlled-proxy/) • [CHANGELOG](https://github.com/karmaniverous/controlled-proxy/tree/main/CHANGELOG.md)

<!-- /TYPEDOC_EXCLUDE -->

## Installation

```bash
npm install @karmaniverous/controlled-proxy
```

## Usage

```ts
import {
  controlledProxy,
  controlProp,
  disabledMemberHandlerProp,
} from './controlledProxy';

// Create a controlled console logger. Info messages are disabled by default.
const controlledConsoleLogger = controlledProxy({
  defaultControls: { debug: true, info: false },
  target: console,
});

// Log messages.
controlledConsoleLogger.debug('debug log');
controlledConsoleLogger.info('info log');
// > debug log

// Disable debug messages & enable info messages.
controlledConsoleLogger[controlProp].debug = false;
controlledConsoleLogger[controlProp].info = true;

// Log messages again.
controlledConsoleLogger.debug('debug log');
controlledConsoleLogger.info('info log');
// > info log

// Change the disabled member handler.
controlledConsoleLogger[disabledMemberHandlerProp] = (
  target: Console,
  prop: PropertyKey,
) => target.log(`Accessed disabled member: ${prop.toString()}`);

// Log messages one more time.
controlledConsoleLogger.debug('debug log');
controlledConsoleLogger.info('info log');
// > Accessed disabled member: debug
// > info log

// Create a class that accepts a proxied logger as a constructor argument.
class MyClass {
  // Limit logger type to the keys requiring proxy support.
  constructor(private logger: Pick<Console, 'debug' | 'info'>) {}

  // Exercise the proxied logger.
  myMethod() {
    this.logger.debug('debug log');
    this.logger.info('info log');
  }
}

// Instantiate the class with the controlled console logger.
const myConsoleInstance = new MyClass(controlledConsoleLogger);

// Exercise the proxied console logger from the class.
myConsoleInstance.myMethod();
// > Accessed disabled member: debug
// > info log

// Create an equivalent controlled winston logger.
import { createLogger, type Logger } from 'winston';

const controlledWinstonLogger = controlledProxy({
  defaultControls: { debug: false, info: true },
  defaultDisabledMemberHandler: (target: Logger, prop: PropertyKey) =>
    target.log('alert', `Accessed disabled member: ${prop.toString()}`),
  target: createLogger(),
});

// Instantiate the class again with the controlled winston logger.
const myWinstonInstance = new MyClass(controlledWinstonLogger);

// Exercise the proxied winston logger from the class.
myWinstonInstance.myMethod();
// > [winston] { "level":"alert", "message":"Accessed disabled member: debug" }
// > [winston] { "level":"info", "message":"info log" }
```

---

Built for you with ❤️ on Bali! Find more great tools & templates on [my GitHub Profile](https://github.com/karmaniverous).
