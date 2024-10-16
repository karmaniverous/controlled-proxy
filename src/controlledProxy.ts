// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ControlledMethod = (...args: any[]) => any;

export type ControlledPartial<Properties extends PropertyKey> = Record<
  Properties,
  unknown
>;

export interface ControlledProxyOptions<
  Properties extends PropertyKey,
  Target extends ControlledPartial<Properties>,
> {
  controls: Record<Properties, boolean>;
  target: Target;
  defaultProxyFunction?: ControlledMethod;
}

export const control = Symbol('control');

export function controlledProxy<
  Properties extends PropertyKey,
  Target extends ControlledPartial<Properties>,
>({
  controls,
  target,
  defaultProxyFunction,
}: ControlledProxyOptions<Properties, Target>) {
  const sealedControls = Object.seal(controls);

  return new Proxy(target, {
    get(targetObj, prop, receiver): unknown {
      // if property is control property, return it
      if (prop === control) return sealedControls;
      const value = Reflect.get(targetObj, prop, receiver);

      return prop in sealedControls // controlled?
        ? sealedControls[prop as Properties] // controlled & enabled?
          ? typeof value === 'function' // controlled & enabled & function?
            ? value.bind(targetObj) // controlled & enabled & function
            : value // controlled & enabled & !function
          : typeof value === 'function' // controlled & !enabled & function?
            ? (defaultProxyFunction ?? (() => undefined)) // controlled & !enabled & function
            : (defaultProxyFunction?.() ?? undefined) // controlled & !enabled & !function
        : value; // !controlled
    },

    set(targetObj, prop, value, receiver): boolean {
      return !(prop in sealedControls) || sealedControls[prop as Properties]
        ? Reflect.set(targetObj, prop, value, receiver) // !controlled | enabled
        : false;
    },
  }) as Target & { [control]: Record<Properties, boolean> };
}
