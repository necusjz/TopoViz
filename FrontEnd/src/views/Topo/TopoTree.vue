<template>
  <div class="app-stage" @mouseleave="leaveContainer">
    <div class="stage-wrap" id="stage">
      <div class="none-topoTree" v-if="isNoneData"></div>
    </div>
    <div class="stage-toolbar">
      <div class="stage-toolbar-item" @click="zoom(1)">
        <i class="el-icon-plus"></i>
      </div>
      <div class="stage-toolbar-item" @click="zoom(-1)">
        <i class="el-icon-minus"></i>
      </div>
    </div>
    <TipDialog></TipDialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide, Watch } from 'vue-property-decorator';
import { State } from 'vuex-class';
import * as xCanvas from '../../lib';
import { Vertex } from '@/lib/typeof/typeof';
import dJson from './data.json';
import { Node, VisibleType } from '../../types/type';
import * as util from '../../util/util';
import bus from '../../util/bus';
import TipDialog from '../Dialog/TipDialog.vue';
const { graphlib, dagre } = require('dagre-d3');

@Component({
  components: {
    TipDialog,
  },
})
export default class TopoTree extends Vue {
  @Prop() private msg!: string;
  @Provide() private stage: any
  @Provide() private center: Vertex = [0, 0];
  @State((state) => state.app.isNoneData) isNoneData: any;
  @Watch('isNoneData')
  public watchData(val: boolean) {
    if (!val) {
      this.initTopoTree();
    }
  }
  mounted() {
    if (!this.isNoneData) {
      this.initTopoTree();
    }
  }
  public initTopoTree() {
    this.stage = new xCanvas.Stage('stage', {zoomChange: 0.1});
    const g = new graphlib.Graph();
    g.setGraph({
      rankdir: 'BT',
      // align: 'dl', // 'dl、dr、ul、ur'
      ranksep: 80,
    });
    for (const node of dJson) {
      g.setNode(String(node.id), node);
    }
    for (const node of dJson) {
      if (node.pId) {
        g.setEdge(String(node.pId), String(node.id), {source: g.node(String(node.pId)), target: node});
      }
    }
    dagre.layout(g);
    const edges = g.edges().map((e: any) => g.edge(e));
    const nodes = g.nodes().map((n: any) => g.node(n));
    this.createNetWork(nodes, edges);
    this.clearEvent();
    window.addEventListener('resize', () => {
      const stage: xCanvas.Stage = this.stage;
      stage.setView(this.center);
    });
  }
  public zoom(step: number) {
    if (this.isNoneData) {
      return;
    }
    const stage: xCanvas.Stage = this.stage;
    if (step > 0) {
      stage.zoomIn();
    } else {
      stage.zoomOut();
    }
  }
  public clearEvent() {
    const stage: xCanvas.Stage = this.stage;
    stage.clearAllEvents();
    stage.on('mousemove', util.throttle((e: any) => {
      const layer = stage.getLayerByPosition(e.pos);
      if (layer) {
        stage.clearHighLightLayer();
        stage.addHighLightLayer(layer);
        stage.hilightLayers();
        if (layer.getLayerType() === 'IMAGE') {
          const v = stage.transferWorldCoordinateToScreen(layer.getBound().getCenter());
          bus.$emit(VisibleType.TIPVISIBLE, true, {left: v[0], top: v[1]});
        } else {
          bus.$emit(VisibleType.TIPVISIBLE, false);
        }
      } else {
        bus.$emit(VisibleType.TIPVISIBLE, false);
        stage.clearHighLightLayer();
      }
    }, 100));
    stage.on('click', (e: any) => {
      const layer = stage.getLayerByPosition(e.pos);
      if (layer && layer.getLayerType() === 'IMAGE') {
        window.location.hash = '#X0934_RTN950-09';
        setTimeout(() => {
          window.location.hash = '';
        });
      }
    });
  }
  public getArrowData(v1: Vertex, v2: Vertex): Vertex[] {
    const p = new xCanvas.Math.Vector2(v1);
    const q = new xCanvas.Math.Vector2(v2);
    const dir = new xCanvas.Math.Vector2(q.x - p.x, q.y - p.y);
    const oppositDir = dir.clone().rotate(180).normalize();
    const angle = 60;
    const len = 3;
    const p1 = q.clone().add(oppositDir.clone().rotate(angle / 2).scale(len));
    const p2 = q.clone().add(oppositDir.clone().rotate(-angle / 2).scale(len));
    return [v2, [p1.x, p1.y], [p2.x, p2.y]];
  }
  public createNetWork(nodes: any[], edges: any[]) {
    const stage: xCanvas.Stage = this.stage;
    const size: number = 40;
    edges.forEach((edge: any) => {
      const pts: Vertex[] = [];
      pts.push([edge.source.x, edge.source.y - size / 2 - 3], [edge.target.x, edge.target.y + size / 2 + 3]);
      const leader = new xCanvas.Polyline(pts, {color: '#0276F7'});
      const arrow = new xCanvas.Polygon(this.getArrowData(pts[0], pts[1]), {color: '#0276F7', fillOpacity: 1});
      const group = new xCanvas.LayerGroup([leader, arrow]).addTo(stage);
    });
    let bound: xCanvas.Math.Bound = new xCanvas.Math.Bound(0, 0, 0, 0);
    nodes.forEach((node: any) => {
      const url = require(`../../assets/${node.type}.png`);
      const childLayer = new xCanvas.ImageLayer(url, node.x, node.y, size, size).addTo(stage);
      bound = bound ? bound.expand(childLayer.getBound()) : childLayer.getBound();
    });
    this.center = bound.getCenter();
    stage.setView(this.center);
  }
  public leaveContainer() {
    bus.$emit(VisibleType.TIPVISIBLE, false);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.app-stage {
  position: relative;
  width: 100%;
  height: calc(100% - 50px);
  .stage-wrap {
    width: 100%;
    height: 100%;
    cursor: pointer;
    background-image: url('../../assets/topo-bg.jpg');
    background-size: cover;
  }
  .none-topoTree {
    width: 100%;
    height: 100%;
    background-image: url('../../assets/none-topoTree.png');
    background-position: center;
    background-size: 30% 30%;
    background-repeat: no-repeat;
  }
  .stage-toolbar {
    position: absolute;
    top: 40px;
    right: 20px;
    height: 80px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    z-index: 5;
    cursor: pointer;
    .stage-toolbar-item {
      width: 30px;
      height: 30px;
      box-sizing: border-box;
      box-shadow: 0 4px 8px 0 rgba(180,179,179,0.50);
      border-radius: 4px;
      color: #B5B2B2;
      font-size: 18px;
      line-height: 30px;
      &:hover {
        color: #409EFF;
      }
    }
    .stage-toolbar-item:active {
      box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);
    }
  }
}
</style>
