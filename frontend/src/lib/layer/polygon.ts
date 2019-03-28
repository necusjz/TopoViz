import Polyline from './polyline';
import { GraphType, Vertex } from '../typeof/typeof';
import * as math from '../math';

export default class Polygon extends Polyline {
  constructor(geo: Vertex[] | Vertex[][], options: {[k: string]: any} = {}) {
    const defaultOptions = {
      fill: true,
      stroke: true,
      weight: 1,
    };
    super(geo, {...defaultOptions, ...options});
    this.highOptions.fill = typeof this.options.fill === 'undefined' ? true : this.options.fill;
  }
  public getLayerType(): GraphType.POLYGON {
    return GraphType.POLYGON;
  }
  public isPointClosest(p: Vertex, tolerance: number = 0): boolean {
    const geometry: any = this.getGeometry();
    if (this.options.fill || !this.options.strict) {
      const mpolygon: math.Polygon = new math.Polygon(geometry);
      return mpolygon.contain(p, tolerance);
    } else {
      const dis = this.getMinDistance(p);
      return dis <= this.tolerance;
    }
  }
}
