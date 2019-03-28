export function throttle(fn: any, delay: number = 50, isDebounce: boolean = false) {
    let timer = 0;
    let lastCall = 0;
    return function () {
      if (isDebounce) {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
          fn(...arguments);
        }, delay);
      } else {
        const now = Date.now();
        if (now - lastCall < delay) return;
        lastCall = now;
        fn(...arguments);
      }
    }
  }