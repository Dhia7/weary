let visible = false;
const listeners = new Set<() => void>();

export function publishHeroCopyVisible() {
  visible = true;
  listeners.forEach((listener) => listener());
}

export function subscribeHeroCopyVisible(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getHeroCopyVisible() {
  return visible;
}
