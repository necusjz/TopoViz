import Layer from './layer';
import { GraphType } from '../typeof/typeof';
import Util from '../util/util';
import * as math from '../math';
import { Vertex } from '@/lib/math/typedef/geometry_type';

export default class ImageLayer extends Layer {
  public url: string;
  public accesible: boolean = true;
  public x: number;
  public y: number;
  private width: number;
  private height: number;
  constructor(url: string, x: number, y: number, width?: number, height?: number, options: {[k: string]: string} = {}) {
    super();
    this.url = url;
    this.x = x;
    this.y = y;
    this.width = width || -1;
    this.height = height || -1;
    this.setOptions(options);
  }
  public getLayerType() {
    return GraphType.IMAGE;
  }
  public getGeometry(): math.Bound {
    return new math.Bound(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
  }
  public setImage(url: string, width?: number, height?: number) {
    this.url = url;
    if (width) {
      this.width = width;
    }
    if (height) {
      this.height = height;
    }
    this.updateAll();
  }
  public async loadImageData(): Promise<any> {
    const image: HTMLImageElement = new Image();
    // image.setAttribute('crossOrigin', 'anonymous');
    image.src = this.url;
    const self = this;
    return new Promise((resolve, reject) => {
      image.addEventListener('load', () => {
        self._setImage(image);
        resolve(image);
      });
      image.addEventListener('error', () => {
        self.accesible = false;
        reject('image is not found');
      });
    });
  }
  public translate(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
    this.updateAll();
  }
  public isPointClosest(p: Vertex): boolean {
    if (this.options.type === 'baseLayer') {
      return false;
    } else {
      const bound = this.getBound();
      return bound.contain(p);
    }
  }
  public isWithinBound(bound: math.Bound): boolean {
    if (this.options.type === 'baseLayer') {
      return false;
    } else {
      const bbound = this.getBound();
      return bound.isOverlaped(bbound);
    }
  }
  public isIntersectWithBound(bound: math.Bound): boolean {
    if (this.options.type === 'baseLayer') {
      return false;
    } else {
      const bbound = this.getBound();
      return bbound.isOverlaped(bound);
    }
  }
  public clone() {
    return new ImageLayer(this.url, this.x, this.y, this.width, this.height, {...this.options});
  }
  private _setImage(image: HTMLImageElement) {
    if (this.width === -1 || this.height === -1) {
      this.width = image.width;
      this.height = image.height;
    }
  }
}
