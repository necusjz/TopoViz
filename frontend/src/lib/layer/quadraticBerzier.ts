import Layer from './layer';
import { GraphType, Vertex } from '../typeof/typeof';
import * as math from '../math';

export default class QuadraticBerzier extends Layer {
  private p0: Vertex;
  private p1: Vertex;
  private cp: Vertex;
  constructor(start: Vertex, cp: Vertex, end: Vertex, options: {[k: string]: any} = {}) {
    super();
    const defaultOptions = {
      stroke: true,
      weight: 1,
    };
    this.setOptions({...defaultOptions, ...options});
    this.highOptions.fill = false;
    this.p0 = start;
    this.p1 = end;
    this.cp = cp;
  }
  public getLayerType(): GraphType {
    return GraphType.QUADRATICBERZIER;
  }
  public clone(): QuadraticBerzier {
    const options = {...this.options};
    delete options._stage;
    delete options._render;
    return new QuadraticBerzier(this.p0, this.cp, this.p1, options);
  }
  /**
   * 几何方程计算太难，用高次拟合法来暴力求解
   */
  public isPointClosest(p: Vertex,tolerance?: number): boolean {
    const step: number = 0.001;
    const {a1, b1, c1, a2, b2, c2} = this.getFactors();
    let dis: number = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i <= 1; i += step) {
      const x = a1 * i * i + b1 * i + c1;
      const y = a2 * i * i + b2 * i + c2;
      const d = (x - p[0]) ** 2 + (y - p[1]) ** 2;
      dis = Math.min(dis, d);
    }
    return tolerance !== undefined ? dis <= tolerance : dis <= this.tolerance;
  }
  public getGeometry(): Vertex[] {
    return [this.p0, this.cp, this.p1];
  }
  public setGeometry(start: Vertex, cp: Vertex, end: Vertex) {
    this.p0 = start;
    this.p1 = end;
    this.cp = cp;
    this.updateAll();
  }
  public translate(dx: number, dy: number) {
    [this.p0, this.cp, this.p1].forEach((p: Vertex) => {
      p[0] += dx;
      p[1] += dy;
    });
    this.updateAll();
  }
  public getBound(): math.Bound {
    const step: number = 1 / 40;
    const {a1, b1, c1, a2, b2, c2} = this.getFactors();
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = -Number.MAX_VALUE;
    let maxY = -Number.MAX_VALUE;
    for (let i = 0; i <= 1; i += step) {
      const x = a1 * i * i + b1 * i + c1;
      const y = a2 * i * i + b2 * i + c2;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    return new math.Bound(minX, minY, maxX - minX, maxY - minY);
  }
  private getFactors(): {[k: string]: number} {
    const a1: number = this.p0[0] - 2 * this.cp[0] + this.p1[0];
    const b1: number = 2 * (this.cp[0] - this.p0[0]);
    const c1: number = this.p0[0];
    const a2: number = this.p0[1] - 2 * this.cp[1] + this.p1[1];
    const b2: number = 2 * (this.cp[1] - this.p0[1]);
    const c2: number = this.p0[1];
    return {a1, b1, c1, a2, b2, c2};
  }
}
