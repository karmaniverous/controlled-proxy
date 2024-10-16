// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ControlledMethod = (...args: any[]) => any;

export type ControlledPartial<Properties extends PropertyKey> = Record<
  Properties,
  unknown
>;

export type ControlledProxyHandler<
  Properties extends PropertyKey,
  Target extends ControlledPartial<Properties>,
> = (target: Target, p: PropertyKey, receiver: any, ...args: any[]) => any; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface ControlledProxyOptions<
  Properties extends PropertyKey,
  Target extends ControlledPartial<Properties>,
> {
  controls: Record<Properties, boolean>;
  defaultHandler?: ControlledProxyHandler<Properties, Target>;
  target: Target;
}

export const control = Symbol('control');

export const controlledProxy = <
  Properties extends PropertyKey,
  Target extends ControlledPartial<Properties>,
>({
  controls,
  defaultHandler,
  target,
}: ControlledProxyOptions<Properties, Target>) =>
  new Proxy(target, {
    get(targetObj, prop, receiver): unknown {
      // if property is control property, return it
      if (prop === control) return controls;
      const value = Reflect.get(targetObj, prop, receiver);

      return prop in controls // controlled?
        ? controls[prop as Properties] // controlled & enabled?
          ? typeof value === 'function' // controlled & enabled & function?
            ? value.bind(targetObj) // controlled & enabled & function
            : value // controlled & enabled & !function
          : typeof value === 'function' // controlled & !enabled & function?
            ? defaultHandler // controlled & !enabled & function & defaultHandler?
              ? (...args: unknown[]) =>
                  defaultHandler(targetObj, prop, receiver, ...args) // eslint-disable-line @typescript-eslint/no-unsafe-return
              : () => undefined
            : defaultHandler?.(targetObj, prop, receiver) // controlled & !enabled & !function
        : value; // !controlled
    },

    set(targetObj, prop, value, receiver): boolean {
      return !(prop in controls) || controls[prop as Properties]
        ? Reflect.set(targetObj, prop, value, receiver) // !controlled | enabled
        : false;
    },
  }) as Target & { [control]: Record<Properties, boolean> };
