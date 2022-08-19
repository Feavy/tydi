export default function Singleton(constructor: Function) {
};

// export default function Singleton(name: string) {
//   return function (constructor: Function) {
//       console.log("target", constructor);
//       console.log("target", constructor.prototype);
//       // this is the decorator
//       // do something with 'target' and 'value'...
//     };
// };