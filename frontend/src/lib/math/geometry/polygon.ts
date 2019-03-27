import Polyline from './polyline';
import Line from './line';
import { XY, Vertex } from '../typedef/geometry_type';
import Bound from '../math/bound';
import Base from '../math/base';

export default class Polygon extends Polyline {
  constructor(coordinates: Vertex[] | Vertex[][]) {
    super(coordinates);
    this._cleanData();
  }
  /**
   * isPointAtPolygon
    p: Vertex, 
    coords: Vertex[]
  */
  public isPointAtPolygon(p: Vertex, coords: Vertex[]) {
    let count = 0;
    for (let i = 0; i < coords.length - 1; ++i) {
      const curPt: Vertex = coords[i];
      const nextPt: Vertex = coords[i + 1];
      if (this._isWithInTrapezoid(p, curPt, nextPt)) {
        count++;
      }
    }
    return count % 2 === 1;
  }
  public contain(pt: XY | Vertex, tolerance: number = 2): boolean {
    pt = Base.transformPointToArray(pt);
    const bound: Bound = this.getBound();
    if (!bound.contain(pt)) {
      return false;
    }
    const flatList = this.coordinates.flat();
    if (Array.isArray(flatList[0])) {
      for (const coords of this.coordinates) {
        const geos = coords as Vertex[];
        if (geos.length === 2) {
          const dis = Line.getDistanceToLine(pt, geos[0], geos[1]);
          if (dis < tolerance) {
            return true;
          }
        } else if (this.isPointAtPolygon(pt, geos)) {
          return true;
        }
      }
    } else{
      return this.isPointAtPolygon(pt, this.coordinates as Vertex[]);
    }
    return false;
  }
  private _cleanData() {
    const flatList = this.coordinates.flat();
    if (Array.isArray(flatList[0])) { // 多面
      for (const coords of this.coordinates) {
        const geos: any = coords;
        if (geos.length > 2 && !Base.isSamePoint(geos[0], geos[geos.length - 1])) {
          geos.push(coords[0]);
        }
      }
    } else {
      const coords = this.coordinates as Vertex[];
      if (!Base.isSamePoint(coords[0], coords[coords.length - 1])) {
        coords.push(coords[0]);
      }
    }
  }
  private _isWithInTrapezoid(pt: Vertex, curPt: Vertex, nextPt: Vertex): boolean {
    const maxY: number = Math.max(curPt[1], nextPt[1]);
    const minY: number = Math.min(curPt[1], nextPt[1]);
    return Base.isLeftOfLine(pt, curPt, nextPt) && pt[1] > minY && pt[1] < maxY;
  }
}
