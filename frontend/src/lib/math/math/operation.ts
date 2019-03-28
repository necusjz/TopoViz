import Constant from './constant';
import {XY} from '../typedef/geometry_type';

export default class Operation {
  public static degreeToRadius(angle: number): number {
    return Math.PI * angle / 180;
  }
  public static radiusToDegree(rad: number): number {
    return rad / Math.PI * 180;
  }
  public static getDotMultiply(v0: XY, v1: XY): number {
    return v0.x * v1.x + v0.y * v1.y;
  }
  public static getCrossMultiply(v0: XY, v1: XY): number {
    return v0.x * v1.y - v0.y * v1.x;
  }
}
