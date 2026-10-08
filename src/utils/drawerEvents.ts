type Listener = (isOpen: boolean) => void;
const listeners: Listener[] = [];

export const drawerEvents = {
  subscribe(fn: Listener) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx > -1) listeners.splice(idx, 1);
    };
  },
  openDrawer() {
    listeners.forEach((fn) => fn(true));
  },
  closeDrawer() {
    listeners.forEach((fn) => fn(false));
  },
};
