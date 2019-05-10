import { baseUrl } from '@/util/config';

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

  export function generateUUID(): string {
    let d = new Date().getTime();
    if (window.performance && typeof window.performance.now === "function") {
        d += performance.now(); //use high-precision timer if available
    }
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

function formatSingleNumber(num: number): string {
  return num < 10 ? '0' + num : num.toString();
}
export function generateDateByTimestamp(timeStamp: number): string {
  const date = new Date(timeStamp);
  const year: number = date.getFullYear();
  const month: number = date.getMonth() + 1;
  const day: number = date.getDate();
  const h: number = date.getHours();
  const m: number = date.getMinutes();
  const s: number = date.getSeconds();
  return `${year}-${formatSingleNumber(month)}-${formatSingleNumber(day)} ${formatSingleNumber(h)}:${formatSingleNumber(m)}:${formatSingleNumber(s)}`
}

export function decimalToPercentage(decimal: number, fix: number = 2) {
  if (decimal === 0) {
    return '--';
  } else if (decimal % 1 !== 0) {
    return `${(decimal * 100).toFixed(fix)}%`;
  } else {
    return `${decimal * 100}%`;
  }
}

export function downLoad(url: string) {
  const a: HTMLAnchorElement = document.createElement('a');
  a.href = `${baseUrl}${url}`;
  a.target = '_blank';
  a.click();
}