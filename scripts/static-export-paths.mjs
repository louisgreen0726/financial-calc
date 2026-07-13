function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function normalizeBasePath(value = "") {
  if (!value) return "";
  invariant(value.startsWith("/"), `Base path must start with "/": ${value}`);
  invariant(value !== "/" && !value.endsWith("/"), `Base path must not be "/" or end with "/": ${value}`);
  invariant(!value.includes("?") && !value.includes("#") && !value.includes("\\"), `Invalid base path: ${value}`);
  invariant(
    value.split("/").every((segment, index) => index === 0 || (segment && segment !== "." && segment !== "..")),
    `Invalid base path segment: ${value}`
  );
  return value;
}

export function withBasePath(pathname, basePath = "") {
  invariant(typeof pathname === "string" && pathname.startsWith("/"), `Path must start with "/": ${pathname}`);
  return `${normalizeBasePath(basePath)}${pathname}`;
}
