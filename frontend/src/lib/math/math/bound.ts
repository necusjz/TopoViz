import { Vertex } from '../typedef/geometry_type';
import Base from './base';
import Vector2 from './vector2';

export default class Bound {
  /**
   * 判断两个Bound是否相交
   * @param bound1 Bound
   * @param bound2 Bound
   */
  public static isOverlaped(bound1: Bound, bound2: Bound): boolean {
    return bound1.isOverlaped(bound2);
  }
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  constructor(x: any, y: any, width: number = 0, height: number = 0) {
    if (Array.isArray(x) && Array.isArray(y)) {
      const minX = Math.min(x[0], y[0]);
      const minY = Math.min(x[1], y[1]);
      const maxX = Math.max(x[0], y[0]);
      const maxY = Math.max(x[1], y[1]);
      this.x = minX;
      this.y = minY;
      this.width = Math.abs(maxX - minX);
      this.height = Math.abs(maxY - minY);
    } else {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
  }
  /**
   * clone新的bound
   */
  public clone(): Bound {
    return new Bound(this.x, this.y, this.width, this.height);
  }
  /**
   * 返回Bound属性
   */
  public getBound() {
    return {x: this.x, y: this.y, width: this.width, height: this.height};
  }
  /**
   * 获取Bound的中心点
   */
  public getCenter(): Vertex {
    return [this.x + this.width / 2, this.y + this.height / 2];
  }
  /**
   * 获取Bound的东北角点
   */
  public getNorthEast(): Vertex {
    return [this.x + this.width, this.y + this.height];
  }
  /**
   * 获取Bound的西南角坐标
   */
  public getSouthWest(): Vertex {
    return [this.x, this.y];
  }
  /**
   * 返回bound的顶点
   */
  public getVetexs(): Vertex[] {
    return [[this.x, this.y], [this.x, this.y + this.height], [this.x + this.width, this.y + this.height], [this.x + this.width, this.y]];
  }
  /**
   * 判断与另一个Bound是否相交
   * @param bound Bound
   */
  public isOverlaped(bound: Bound): boolean {
    const center0 = this.getCenter();
    const center1 = bound.getCenter();
    return Math.abs(center1[0] - center0[0]) < (this.width + bound.width) / 2 &&
      Math.abs(center1[1] - center0[1]) < (this.height + bound.height) / 2;
  }
  /**
   * 点或者bound是否在Bound内
   * @param a
   */
  public contain(a: any ): boolean {
    if (a instanceof Bound) {
      for (const v of a.getVetexs()) {
        if (!this.contain(v)) {
          return false;
        }
      }
      return true;
    }
    return a[0] > this.x && a[1] > this.y && a[0] < (this.x + this.width) && a[1] < (this.y + this.height);
  }
  /**
   * 扩展Bound
   * @param bound Bound
   */
  public expand(bound: Bound): Bound {
    const minX = Math.min(this.x, bound.x);
    const minY = Math.min(this.y, bound.y);
    const maxX = Math.max(this.x + this.width, bound.x + bound.width);
    const maxY = Math.max(this.y + this.height, bound.y + bound.height);
    this.x = minX;
    this.y = minY;
    this.width = maxX - minX;
    this.height = maxY - minY;
    return this;
  }
  /**
   * 判断线段是否与Bound相交
   * @param p1 点p1
   * @param p2 点p2
   */
  public isIntersectOfSegment(p1: Vertex, p2: Vertex): boolean {
    const bound = Base.getBoundOfPoints([p1, p2]);
    if (!bound.isOverlaped(this)) {
      return false;
    } else if (this.contain(p1) || this.contain(p2)) {
      return true;
    } else {
      const base: Vector2 = Base.getDirectionVec(p1, p2);
      const vertexs: Vertex[] = this.getVetexs();
      for (let i = 1; i < vertexs.length; i++) {
        const preVec: Vector2 = Base.getDirectionVec(p1, vertexs[i - 1]);
        const curVec: Vector2 = Base.getDirectionVec(p1, vertexs[i]);
        if (Base.isBothSide(base, preVec, curVec)) {
          return true;
        }
      }
      return false;
    }
  }
}
