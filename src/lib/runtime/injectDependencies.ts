export default function injectDependencies<T>(fun: (...args: any[]) => T): T {
  const newFunction = (...args: any[]) => newFunction.body(...args);
  newFunction.body = fun;
  // @ts-ignore
  return newFunction;
}
