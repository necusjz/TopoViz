import Layer from './layer';
import { GraphType, Vertex } from '../typeof/typeof';
import * as math from '../math';

export default class Rectangle extends Layer {
  public width: number = 0;
  public height: number = 0;
  public southWest: Vertex = [];
  constructor(a?: any, b?: any, c?: any, d?: any) {
    super();
    if (typeof arguments[1] === 'number' && typeof arguments[2] === 'number') {
      const southWest = arguments[0].slice();
      const width = arguments[1];
      const height = arguments[2];
      if (width < 0) {
        southWest[0] += southWest[0];
      }
      if (height < 0) {
        southWest[1] += southWest[1];
      }
      this.southWest = [southWest[0], southWest[1]];
      this.width = Math.abs(width);
      this.height = Math.abs(height);
    } else if (Array.isArray(arguments[0]) && Array.isArray(arguments[1])) {
      this.southWest = [Math.min(arguments[0][0], arguments[1][0]), Math.min(arguments[0][1], arguments[1][1])];
      this.width = Math.abs(arguments[0][0] - arguments[1][0]);
      this.height = Math.abs(arguments[0][1] - arguments[1][1]);
    } else {
      throw TypeError('Rectangle constructor arguments in invalid');
    }
    let options = {};
    if (Object.prototype.toString.call(arguments[arguments.length - 1]) === '[object Object]') {
      options = {...arguments[arguments.length - 1]};
    }
    const defaultOptions = {
      fill: true,
      stroke: true,
      weight: 1,
    };
    this.setOptions({...defaultOptions, ...options});
    this.highOptions.fill = this.options.fill;
  }
  public getGeometry(): math.Bound {
    return new math.Bound(this.southWest[0], this.southWest[1], this.width, this.height);
  }
  public getLayerType(): GraphType.RECTANGLE {
    return GraphType.RECTANGLE;
  }
  /**
   * 返回左上角坐标
   */
  public getNorthWest(): Vertex {
    return [this.southWest[0], this.southWest[1] + this.height];
  }
  /**
   * 返回左下角坐标
   */
  public getSouthWest(): Vertex {
    return this.southWest;
  }
  public translate(dx: number, dy: number) {
    this.southWest[0] += dx;
    this.southWest[1] += dy;
    this.updateAll();
  }
  /**
   * 设置矩形的Bound
   * @param bound Bound
   */
  public setBound(bound: math.Bound) {
    this.southWest = [bound.x, bound.y];
    this.width = bound.width;
    this.height = bound.height;
    this.updateAll();
  }
  /**
   * 设置对角坐标
   * @param corner1 对角坐标1
   * @param corner2 对角坐标2
   */
  public setCorner(corner1: Vertex, corner2: Vertex) {
    this.southWest = [Math.min(corner1[0], corner2[0]), Math.min(corner1[1], corner2[1])];
    this.width = Math.abs(corner1[0] - corner2[0]);
    this.height = Math.abs(corner1[1] - corner2[1]);
    this.updateAll();
  }
  public isPointClosest(p: Vertex): boolean {
    const bound: math.Bound = this.getGeometry();
    if (this.options.fill || !this.options.strict) {
      return bound.contain(p);
    } else {
      const ply: math.Polyline = new math.Polyline(bound.getVetexs());
      const nearestPoint: Vertex = ply.getNearestPoint(p);
      const dis: number = math.Base.getDistance(p, nearestPoint);
      return dis <= this.tolerance;
    }
  }
  public getNearestPoint(p: Vertex): Vertex {
    const bound = this.getBound();
    const vertexs: Vertex[] = bound.getVetexs();
    vertexs.push(vertexs[0]);
    const ply = new math.Polyline(vertexs);
    return ply.getNearestPoint(p);
  }
  /**
   * 图层是否与Bound相交
   * @param bound Bound
   */
  public isIntersectWithBound(bound: math.Bound): boolean {
    return bound.isOverlaped(this.getBound());
  }
  public clone() {
    const options = {...this.options, _render: null, _stage: null};
    return new Rectangle([this.southWest[0], this.southWest[1]], this.width, this.height, options);
  }
}
