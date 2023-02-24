export default function injectDependencies(fun: any) {
  const newFunction = () => newFunction.body();
  newFunction.body = fun;
  return newFunction;
}
