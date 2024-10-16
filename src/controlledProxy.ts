/**
 * Template type representing the controlled properties of a proxy object.
 *
 * @typeParam Properties - The property keys of the controlled properties.
 */
export type ControlledPartial<Properties extends PropertyKey> = Record<
  Properties,
  unknown
>;

/**
 * Handler function for a disabled controlled proxy object member.
 *
 * @typeParam Properties - Union representing property keys of the controlled properties.
 * @typeParam Target - The target object type. Must have all keys in `Properties`.
 *
 * @param target - The target object.
 * @param p - The property key.
 * @param receiver - The proxy object.
 * @param args - The arguments passed to the function.
 *
 * @returns The result of the handler function.
 *
 * @remarks
 * The handler function is called when a disabled controlled member of `target` is accessed (i.e. an internal `get` operation).
 *
 * Type parameters will be inferred from the function definition. It should not be necessary to provide them explicitly.
 *
 * Params `target`, `p`, and `receiver` provide runtime context and are the same as the {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/get | `get` method of a `ProxyHandler`}.
 *
 * When not provided, this function defaults to `() => undefined`.
 *
 * If the underlying member is a function, the handler fuction will be called with appropriate `target`, `p`, and `receiver` values, along with any provided `args`.
 *
 * If the underlying member is not a function, the handler function will be called with appropriate `target`, `p`, and `receiver` values, and no `args` and its result returned.
 */
export type DisabledMemberHandler<
  Properties extends PropertyKey,
  Target extends ControlledPartial<Properties>,
> = (target: Target, p: PropertyKey, receiver: any, ...args: any[]) => any; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Symbol representing the control property of a controlled proxy object.
 */
export const controlProp = Symbol('controlProp');

/**
 * Symbol representing the disabled member handler property of a controlled proxy object.
 */
export const disabledMemberHandlerProp = Symbol('disabledMemberHandlerProp');

/**
 * Options for creating a controlled proxy object.
 *
 * @typeParam Properties - Union representing property keys of the controlled properties.
 * @typeParam Target - The target object type. Must have all keys in `Properties`.
 *
 * @remarks
 * Type parameters will be inferred from the option values. It should not be necessary to provide them explicitly.
 */
export interface ControlledProxyOptions<
  Properties extends PropertyKey,
  Target extends ControlledPartial<Properties>,
> {
  /**
   * An object containing the default control flags for each controlled property. This object will be rendered as the {@link controlProp | `[controlProp]`} property of the proxy object.
   */
  defaultControls?: Record<Properties, boolean>;

  /**
   * The default handler function for disabled controlled properties. Defaults to `() => undefined`. See the {@link DisabledMemberHandler | `DisabledMemberHandler`} type for more information.
   */
  defaultDisabledMemberHandler?: DisabledMemberHandler<Properties, Target>;

  /**
   * The target object to proxy.
   */
  target: Target;
}

/**
 * Allows the behavior of any object to be modified & controlled non-destructively at runtime.
 *
 * @param options - The options for creating the controlled proxy object. See {@link ControlledProxyOptions | `ControlledProxyOptions`} for more information.
 *
 * @returns A controlled proxy object.
 *
 * @remarks
 * See the {@link https://github.com/karmaniverous/controlled-proxy#usage | README} for usage examples.
 */
export const controlledProxy = <
  Properties extends PropertyKey,
  Target extends ControlledPartial<Properties>,
>(
  options: ControlledProxyOptions<Properties, Target>,
) => {
  const {
    defaultControls = {} as Record<Properties, boolean>,
    defaultDisabledMemberHandler = () => undefined,
    target,
  } = options;

  const controls = { ...defaultControls };
  const handlers = { disabledMemberHandler: defaultDisabledMemberHandler };

  return new Proxy(target, {
    get(targetObj, prop, receiver): unknown {
      // if property is managed property, return it
      if (prop === controlProp) return controls;
      if (prop === disabledMemberHandlerProp)
        return handlers.disabledMemberHandler;

      const value = Reflect.get(targetObj, prop, receiver);

      return prop in controls // controlled?
        ? controls[prop as Properties] // controlled & enabled?
          ? typeof value === 'function' // controlled & enabled & function?
            ? value.bind(targetObj) // controlled & enabled & function
            : value // controlled & enabled & !function
          : typeof value === 'function' // controlled & !enabled & function?
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (...args: any[]) =>
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                handlers.disabledMemberHandler(
                  targetObj,
                  prop,
                  receiver,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                  ...args,
                )
            : handlers.disabledMemberHandler(targetObj, prop, receiver) // controlled & !enabled & !function
        : value; // !controlled
    },

    set(targetObj, prop, value, receiver): boolean {
      // set new disbled member handler
      if (prop === disabledMemberHandlerProp) {
        if (typeof value !== 'function')
          throw new TypeError(
            'The disabled member handler must be a function.',
          );
        handlers.disabledMemberHandler = value as DisabledMemberHandler<
          Properties,
          Target
        >;
      }

      // set target property
      return !(prop in controls) || controls[prop as Properties]
        ? Reflect.set(targetObj, prop, value, receiver) // !controlled | enabled
        : false;
    },
  }) as Target & {
    [controlProp]: Record<Properties, boolean>;
    [disabledMemberHandlerProp]: DisabledMemberHandler<Properties, Target>;
  };
};
