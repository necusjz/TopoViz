import { XY } from '../typeof/typeof';

export default class Util {
  public static createID(): string {
    return 'xxxxxxxxxxxx-6xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  public static transformToXY(coord: number[]): XY {
    if (coord.length < 2) {
      throw new Error('coordinate length less than two...');
    }
    return {x: coord[0], y: coord[1]};
  }
  public static transformToArray(xy: XY): number[] {
    return [xy.x, xy.y];
  }
  public static transformToXYPath(path: number[][]): XY[] {
    const newPath: XY[] = [];
    for (const vertex of path) {
      newPath.push(this.transformToXY(vertex));
    }
    return newPath;
  }
  public static transformToArrayPath(path: XY[]): number[][] {
    const newPath: number[][] = [];
    for (const xy of path) {
      newPath.push(this.transformToArray(xy));
    }
    return newPath;
  }
  public static loadImageByBlob(url: string): Promise<any> {
    const xhr: XMLHttpRequest = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.send();
    return new Promise((resolve) => {
      xhr.onload = function() {
        resolve(this.response);
      };
    });
  }
  public static downLoadByBase64String(base64: string, fileName: string = `newFile${Date.now()}`) {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    const blob: Blob = new Blob([uInt8Array], {type: contentType});
    const a: HTMLAnchorElement = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
  }
  public static dimension_Array(arr: any[]): number {
    if (arr instanceof Array) {
        return Math.max(...arr.map((e) => {
            return 1 + Util.dimension_Array(e);
        }));
    } else {
        return 0;
    }
  }
}
