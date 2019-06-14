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
  public isPointClosest(): boolean {
    return false;
  }
  public getGeometry() {
    return '';
  }
  public translate(dx: number, dy: number) {
    [this.p0, this.cp, this.p1].forEach((p: Vertex) => {
      p[0] += dx;
      p[1] += dy;
    });
    this.updateAll();
  }
  public getBound(): math.Bound {
    return new math.Bound(0, 0, 0, 0);
  }
}
