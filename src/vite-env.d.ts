/// <reference types="vite/client" />

declare module 'tz-lookup' {
  function tzlookup(latitude: number, longitude: number): string;
  export default tzlookup;
}
