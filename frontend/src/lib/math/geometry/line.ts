import Vector2 from '../math/vector2';
import Bound from '../math/bound';
import { XY, Vertex } from '../typedef/geometry_type';
import Operation from '../math/operation';
import Base from '../math/base';

export default class Line {
  /**
   * 求点到直线的垂足
   * @param pt 目标点
   * @param v0 直线起点
   * @param v1 直线终点
   */
  public static getPedalPointOfLine(p: XY | Vertex, v0: XY | Vertex, v1: XY | Vertex): Vector2 {
    [p, v0, v1] = Base.transformPointsToXY([p, v0, v1]);
    const vec0: Vector2 = new Vector2(p.x - v0.x, p.y - v0.y);
    const vec1: Vector2 = new Vector2(v1.x - v0.x, v1.y - v0.y);
    const dot: number = Operation.getDotMultiply(vec0, vec1);
    const dis: number = dot / vec1.getModelLength();
    return new Vector2(v0.x, v0.y).add(vec1.normalize().scale(dis));
  }
  /**
   * 返回到线段上最近的点
   * @param p 待测点
   * @param v0 线段起点
   * @param v1 线段终点
   */
  public static getNearestPointToSegment(p: XY | Vertex, v0: XY | Vertex, v1: XY | Vertex): Vertex {
    [p, v0, v1] = Base.transformPointsToArray([p, v0, v1]);
    const pedal: Vector2 = this.getPedalPointOfLine(p, v0, v1);
    if (this.isPointAtSegment(pedal, v0, v1)) {
      return [pedal.x, pedal.y];
    } else {
      const dis1 = Base.getSquareDistance(p, v0);
      const dis2 = Base.getSquareDistance(p, v1);
      return dis1 < dis2 ? Base.transformPointToArray(v0) : Base.transformPointToArray(v1);
    }
  }
  /**
   * 求点到直线的距离
   * @param pt 目标点
   * @param v0 直线起点
   * @param v1 直线终点
   */
  public static getDistanceToLine(p: XY | Vertex, v0: XY | Vertex, v1: XY | Vertex) {
    [p, v0, v1] = Base.transformPointsToArray([p, v0, v1]);
    const vec0: Vector2 = new Vector2(p[0] - v0[0], p[1] - v0[1]);
    const vec1: Vector2 = new Vector2(v1[0] - v0[0], v1[1] - v0[1]);
    const cross: number = Operation.getCrossMultiply(vec0, vec1);
    return Math.abs(cross / vec1.getModelLength());
  }
  /**
   * 判断点在直线上
   * @param {XY | Vertex} p
   * @param {XY | Vertex} v0
   * @param {XY | Vertex} v1
   * @param {number} tolerance
   */
  public static isPointAtLine(p: XY | Vertex, v0: XY | Vertex, v1: XY | Vertex, tolerance?: number): boolean {
    [p, v0, v1] = Base.transformPointsToArray([p, v0, v1]);
    const dir: Vector2 = new Vector2(v1[0] - v0[0], v1[1] - v0[1]);
    const vec1 = new Vector2(p[0] - v0[0], p[1] - v0[1]);
    const cross = Operation.getCrossMultiply(dir, vec1);
    return Base.isZero(cross, tolerance);
  }
  /**
   * 判断点是否在线段上
   * @param p 待测点
   * @param v0 线段起点
   * @param v1 线段终点
   * @param tolerance 容差
   */
  public static isPointAtSegment(p: XY | Vertex, v0: XY | Vertex, v1: XY | Vertex, tolerance?: number): boolean {
    [p, v0, v1] = Base.transformPointsToArray([p, v0, v1]);
    return (p[0] - v0[0]) * (p[0] - v1[0]) <= 0 && (p[1] - v0[1]) * (p[1] - v1[1]) <= 0 && this.isPointAtLine(p, v0, v1);
  }
  /**
   * 判断两条直线是否平行(包含共线)
   * @param {XY | Vertex} p0
   * @param {XY | Vertex} p1
   * @param {XY | Vertex} v0
   * @param {XY | Vertex} v1
   */
  public static isParalled(p0: XY | Vertex, p1: XY | Vertex, v0: XY | Vertex, v1: XY | Vertex, tolerance?: number): boolean {
    [p0, p1, v0, v1] = Base.transformPointsToArray([p0, p1, v0, v1]);
    const dir1: Vector2 = new Vector2(p1[0] - p0[0], p1[1] - p0[1]);
    const dir2: Vector2 = new Vector2(v1[0] - v0[0], v1[1] - v0[1]);
    const cross: number = Operation.getCrossMultiply(dir1, dir2);
    return Base.isZero(cross, tolerance);
  }
  /**
   * 判断两条直线是否共线
   * @param {XY | Vertex} p0
   * @param {XY | Vertex} p1
   * @param {XY | Vertex} v0
   * @param {XY | Vertex} v1
   */
  public static isCollinear(p0: XY | Vertex, p1: XY | Vertex, v0: XY | Vertex, v1: XY | Vertex, tolerance?: number): boolean {
    [p0, p1, v0, v1] = Base.transformPointsToArray([p0, p1, v0, v1]);
    const dir1: Vector2 = new Vector2(p1[0] - p0[0], p1[1] - p0[1]);
    const dir2: Vector2 = new Vector2(v1[0] - v0[0], v1[1] - v0[1]);
    const dir3: Vector2 = new Vector2(p0[0] - v0[0], p1[1] - v0[1]);
    const cross1: number = Operation.getCrossMultiply(dir1, dir2);
    const cross2: number = Operation.getCrossMultiply(dir1, dir3);
    return Base.isZero(cross1, tolerance) && Base.isZero(cross2, tolerance);
  }
  /**
   * 判断两条直线是否相交 Reference
   * @param {XY | Vertex} p0
   * @param {XY | Vertex} p1
   * @param {XY | Vertex} v0
   * @param {XY | Vertex} v1
   */
  public static isIntersect(p0: XY | Vertex, p1: XY | Vertex, v0: XY | Vertex, v1: XY | Vertex, tolerance?: number): boolean {
    return !this.isParalled(p0, p1, v0, v1, tolerance);
  }
  /**
   * 计算两直线的交点 Reference https://blog.csdn.net/yan456jie/article/details/52469130
   * @param {XY | Vertex} p0
   * @param {XY | Vertex} p1
   * @param {XY | Vertex} v0
   * @param {XY | Vertex} v1
   */
  public static getIntersectPt(p0: XY | Vertex, p1: XY | Vertex, v0: XY | Vertex, v1: XY | Vertex) {
    if (this.isParalled(p0, p1, v0, v1)) {
      if (this.isCollinear(p0, p1, v0, v1)) {
        console.warn('These lines is collinear');
        return;
      }
      console.warn('These lines is paralled');
      return;
    }
    [p0, p1, v0, v1] = Base.transformPointsToArray([p0, p1, v0, v1]);
    const vec1: Vector2 = new Vector2(p1[0] - p0[0], p1[1] - p0[1]);
    const vec2: Vector2 = new Vector2(v1[0] - v0[0], v1[1] - v0[1]);
    const vec3: Vector2 = new Vector2(v0[0] - p0[0], v0[1] - p0[1]);
    const vec4: Vector2 = new Vector2(v1[0] - p0[0], v1[1] - p0[1]);
    const l1: number = Math.abs(Operation.getCrossMultiply(vec1, vec3));
    const l2: number = Math.abs(Operation.getCrossMultiply(vec1, vec4));
    let ratio = 0;
    // 线段相交的情况
    if (Base.isBothSide(vec1, vec3, vec4)) {
      ratio = l1 / (l1 + l2);
    } else {
      ratio = l1 / (l1 - l2);
    }
    return new Vector2(v0[0], v0[1]).clone().add(vec2.clone().scale(ratio));
  }
  /**
   * 判断两条线段是否相交
   * @param {XY | Vertex} p0
   * @param {XY | Vertex} p1
   * @param {XY | Vertex} v0
   * @param {XY | Vertex} v1
   */
  public static isIntersectOfSegment(p0: XY | Vertex, p1: XY | Vertex, v0: XY | Vertex, v1: XY | Vertex, tolerance?: number): boolean {
    [p0, p1, v0, v1] = Base.transformPointsToArray([p0, p1, v0, v1]);
    const base1: Vector2 = new Vector2(p1[0] - p0[0], p1[1] - p0[1]);
    const base2: Vector2 = new Vector2(v1[0] - v0[0], v1[1] - v0[1]);
    const vec1: Vector2 = new Vector2(v0[0] - p0[0], v0[1] - p0[1]);
    const vec2: Vector2 = new Vector2(v1[0] - p0[0], v1[1] - p0[1]);
    const vec3: Vector2 = new Vector2(p0[0] - v0[0], p0[1] - v0[1]);
    const vec4: Vector2 = new Vector2(p1[0] - v0[0], p1[1] - v0[1]);
    return Base.isBothSide(base1, vec1, vec2) && Base.isBothSide(base2, vec3, vec4);
  }
  public v0: Vector2;
  public v1: Vector2;
  constructor(v0: XY | Vertex, v1: XY | Vertex) {
    v0 = Base.transformPointToArray(v0);
    v1 = Base.transformPointToArray(v1);
    this.v0 = new Vector2(v0[0], v0[1]);
    this.v1 = new Vector2(v1[0], v1[1]);
  }
  /**
   * 获得直线的方向向量
   */
  public getDirVector(): Vector2 {
    const x: number = this.v1.x - this.v0.x;
    const y: number = this.v1.y - this.v0.y;
    const vec: Vector2 = new Vector2(x, y);
    return vec;
  }
  /**
   * 获得直线方向向量的单位向量
   */
  public getDirection(): Vector2 {
    const vec: Vector2 = this.getDirVector();
    return vec.normalize();
  }
  /**
   * 获得直线的长度
   */
  public getLineLength() {
    const vec: Vector2 = this.getDirVector();
    return vec.getModelLength();
  }
  /**
   * 返回线段的Bound
   */
  public getBound(): Bound {
    const x: number = Math.min(this.v0.x, this.v1.x);
    const y: number = Math.min(this.v0.y, this.v1.y);
    const w: number = Math.abs(this.v1.x - this.v0.x);
    const h: number = Math.abs(this.v1.y - this.v0.y);
    return new Bound(x, y, w, h);
  }
  /**
   * 判断点在直线上
   * @param {XY} pt
   * @param {number} tolerance
   */
  public isPointAtLine(pt: XY | Vertex, tolerance?: number): boolean {
    pt = Base.transformPointToArray(pt);
    const dir: Vector2 = this.getDirVector();
    const vec1 = new Vector2(pt[0] - this.v0.x, pt[1] - this.v1.y);
    const cross = Operation.getCrossMultiply(dir, vec1);
    return Base.isZero(cross, tolerance);
  }
  /**
   * 判断两条直线是否平行(包含共线)
   * @param {Line} line
   */
  public isParalled(line: Line, tolerance?: number): boolean {
    const dir1: Vector2 = this.getDirection();
    const dir2: Vector2 = line.getDirection();
    const cross: number = Operation.getCrossMultiply(dir1, dir2);
    return Base.isZero(cross, tolerance);
  }
  /**
   * 判断两条直线是否共线
   * @param {Line} line
   */
  public isCollinear(line: Line, tolerance?: number): boolean {
    const dir1: Vector2 = line.getDirection();
    const dir2: Vector2 = new Vector2(line.v0.x - this.v0.x, line.v0.y - this.v0.y);
    const cross = Operation.getCrossMultiply(dir1, dir2);
    return this.isParalled(line, tolerance) && Base.isZero(cross, tolerance);
  }
  /**
   * 判断两条直线是否相交
   * @param {Line} line
   */
  public isIntersect(line: Line, tolerance?: number): boolean {
    return !this.isParalled(line, tolerance);
  }
  /**
   * 计算两直线的交点 Reference https://blog.csdn.net/yan456jie/article/details/52469130
   * @param {Line} line
   */
  public getIntersectPt(line: Line) {
    if (this.isParalled(line)) {
      if (this.isCollinear(line)) {
        console.warn('These lines is collinear');
        return;
      }
      console.warn('These lines is paralled');
      return;
    }
    const vec1: Vector2 = this.getDirVector();
    const vec2: Vector2 = line.getDirVector();
    const vec3: Vector2 = new Vector2(line.v0.x - this.v0.x, line.v0.y - this.v0.y);
    const vec4: Vector2 = new Vector2(line.v1.x - this.v0.x, line.v1.y - this.v0.y);
    const l1: number = Math.abs(Operation.getCrossMultiply(vec1, vec3));
    const l2: number = Math.abs(Operation.getCrossMultiply(vec1, vec4));
    let ratio = 0;
    // 线段相交的情况
    if (Base.isBothSide(vec1, vec3, vec4)) {
      ratio = l1 / (l1 + l2);
    } else {
      ratio = l1 / (l1 - l2);
    }
    return line.v0.clone().add(vec2.clone().scale(ratio));
  }
  /**
   * 判断两条线段是否相交
   * @param {Line} line
   */
  public isIntersectOfSegment(line: Line): boolean {
    const base1: Vector2 = this.getDirVector();
    const base2: Vector2 = line.getDirVector();
    const vec1: Vector2 = new Vector2(line.v0.x - this.v0.x, line.v0.y - this.v0.y);
    const vec2: Vector2 = new Vector2(line.v1.x - this.v0.x, line.v1.y - this.v0.y);
    const vec3: Vector2 = new Vector2(this.v0.x - line.v0.x, this.v0.y - line.v0.y);
    const vec4: Vector2 = new Vector2(this.v1.x - line.v0.x, this.v1.y - line.v0.y);
    return Base.isBothSide(base1, vec1, vec2) && Base.isBothSide(base2, vec3, vec4);
  }
  /**
   * 线段是否与Bound相交
   * @param p0 端点1
   * @param p1 端点2
   */
  public isIntersectOfBound(bound: Bound): boolean {
    return bound.isIntersectOfSegment(Base.transformPointToArray(this.v0), Base.transformPointToArray(this.v1));
  }
}
