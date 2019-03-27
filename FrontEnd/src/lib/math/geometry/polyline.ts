import { XY, Vertex } from '../typedef/geometry_type';
import Bound from '../math/bound';
import Base from '../math/base';
import Line from './line';

export default class Polyline {
  public readonly coordinates: Vertex[] | Vertex[][];
  constructor(coordinates: Vertex[] | Vertex[][]) {
    this.coordinates = coordinates;
  }
  public getBound(): Bound {
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = -Number.MAX_VALUE;
    let maxY = -Number.MAX_VALUE;
    const flatList = this.coordinates.flat();
    if (Array.isArray(flatList[0])) {
      for (const coords of this.coordinates) {
        const geos: any = coords;
        for (const coordinate of geos) {
          minX = Math.min(minX, coordinate[0]);
          minY = Math.min(minY, coordinate[1]);
          maxX = Math.max(maxX, coordinate[0]);
          maxY = Math.max(maxY, coordinate[1]);
        }
      }
    } else {
      for (const coordinate of this.coordinates) {
        const pt: Vertex = coordinate as Vertex;
        minX = Math.min(minX, pt[0]);
        minY = Math.min(minY, pt[1]);
        maxX = Math.max(maxX, pt[0]);
        maxY = Math.max(maxY, pt[1]);
      }
    }
    
    return new Bound(minX, minY, maxX - minX, maxY - minY);
  }
  public getNearestPoint(p: XY | Vertex) {
    p = Base.transformPointToArray(p);
    const nearestPoints: Array<{dis: number, pos: Vertex}> = [];
    const flatList = this.coordinates.flat();
    if (Array.isArray(flatList[0])) {
      for (const coords of this.coordinates) {
        const geos = coords as Vertex[];
        for (let i = 0; i < geos.length - 1; i++) {
          const pos = Line.getNearestPointToSegment(p, geos[i], geos[i + 1]);
          const dis = Base.getSquareDistance(p, pos);
          nearestPoints.push({dis, pos});
        }
      }
    } else {
      const coords = this.coordinates as Vertex[];
      for (let i = 0; i < coords.length - 1; i++) {
        const pos = Line.getNearestPointToSegment(p, coords[i], coords[i + 1]);
        const dis = Base.getSquareDistance(p, pos);
        nearestPoints.push({dis, pos});
      }
    }
    nearestPoints.sort((a, b) => {
      return a.dis - b.dis;
    });
    return nearestPoints[0].pos;
  }
  protected transformToArray(coordinates: Array<XY | Vertex>): Vertex[] {
    return Base.transformPointsToArray(coordinates);
  }
}
