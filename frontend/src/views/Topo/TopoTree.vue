<template>
  <div class="app-stage" @mouseleave="leaveContainer">
    <div class="stage-wrap" id="stage">
      <div class="none-topoTree" v-if="isNoneTopoData">
        <p class="none-topoTree-label" v-if="isNonImported">暂无任何数据展示哦，导入一组表格数据试试</p>
        <p class="none-topoTree-label" v-else>暂无topo数据图哦，输入一个Group ID试一试</p>
      </div>
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
import { Node, EventType, NodeData, AlarmData } from '../../types/type';
import * as util from '../../util/util';
import bus from '../../util/bus';
import TipDialog from '../Dialog/TipDialog.vue';
// const { graphlib, dagre } = require('dagre-d3');
// import ForceDirect from '@/util/force-direct';
import TopoTreeHelper from '@/util/topoTree';

@Component({
  components: {
    TipDialog,
  },
})
export default class TopoTree extends Vue {
  @Provide() private stage!: xCanvas.Stage;
  @Provide() private center: Vertex = [0, 0];
  @Provide() private borderLayer!: xCanvas.Layer;
  @Provide() private size: number = 40;
  @State((state) => state.app.isNonImported) private isNonImported!: boolean;
  @State((state) => state.app.isNoneTopoData) isNoneTopoData: any;
  @State((state) => state.app.alarmDatas) private alarmDatas!: AlarmData[];
  @State((state) => state.app.topoDatas) private topoDatas!: NodeData[][];
  @State((state) => state.app.selectAlarm) private selectAlarm!: string;
  @Watch('topoDatas')
  public watchTopoDatas(val: NodeData[][]) {
    this.init();
  }
  @Watch('selectAlarm')
  public watchSlectAlarm(val: string) {
    this.selectNetwork();
  }
  mounted() {
    bus.$on('NETWORKFILTER', (neNames: string[]) => {
      this.stage.startBatch();
      this.stage.eachLayer((layer: xCanvas.Layer) => {
        if (layer.getLayerType() === 'IMAGE') {
          const dirtyData = layer.getDirtyData();
          if (dirtyData && neNames.includes(dirtyData.alarmSourceName)) {
            const url = require(`../../assets/${dirtyData.type}-Error.png`);
            (layer as xCanvas.ImageLayer).setImage(url);
          } else if(dirtyData) {
            const url = require(`../../assets/${dirtyData.type}-Warning.png`);
            (layer as xCanvas.ImageLayer).setImage(url);
          }
        }
      });
      this.stage.endBatch();
    });
  }
  public zoom(step: number) {
    if (this.isNoneTopoData) {
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
      const layers = stage.getLayersByPosition(e.pos);
      const layer = layers.find((layer: xCanvas.Layer) => layer.getLayerType() === 'IMAGE');
      if (layer) {
        stage.clearHighLightLayer();
        stage.addHighLightLayer(layer);
        stage.hilightLayers();
        const v = stage.transferWorldCoordinateToScreen(layer.getBound().getCenter());
        if (layer.dirtyData) {
          bus.$emit(EventType.TIPVISIBLE, true, layer.dirtyData.alarmSourceName, {left: v[0], top: v[1]});
        }
      } else {
        bus.$emit(EventType.TIPVISIBLE, false);
        stage.clearHighLightLayer();
      }
    }, 100));
    stage.on('click', (e: any) => {
      const layers = stage.getLayersByPosition(e.pos);
      const layer = layers.find((layer: xCanvas.Layer) => layer.getLayerType() === 'IMAGE');
      if (layer) {
        const dirtyData = layer.getDirtyData();
        if (dirtyData) {
          window.location.hash = '#' + dirtyData.alarmSourceName;
          this.$store.commit('SET_SELECTALARM', dirtyData.alarmSourceName);
          setTimeout(() => {
            window.location.hash = '';
          });
        }
      }
    });
  }
  public selectNetwork() {
    const layer = this.stage.getLayer((glayer: xCanvas.Layer) => { 
      return glayer.getLayerType() === 'IMAGE' && glayer.dirtyData && glayer.dirtyData.alarmSourceName === this.selectAlarm;
    });
    if (layer) {
      const bound = layer.getBound().expand(4);
      if (this.borderLayer) {
        this.stage.removeLayer(this.borderLayer);
      }
      this.borderLayer = new xCanvas.Rectangle(bound.getSouthWest(), bound.getNorthEast(), {fill: false, color: '#4a96ff'}).addTo(this.stage);
    }
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
    stage.startBatch();
    this.stage.clearAllLayers();
    const size: number = 40;
    edges.forEach((edge: any) => {
      const pts: Vertex[] = [];
      pts.push([edge.source.x, edge.source.y], [edge.target.x, edge.target.y]);
      const leader = new xCanvas.Polyline(pts, {color: '#0276F7'});
      const arrow = new xCanvas.Polygon(this.getArrowData(pts[0], pts[1]), {color: '#0276F7', fillOpacity: 1});
      const group = new xCanvas.LayerGroup([leader, arrow]).addTo(stage);
    });
    let bound: xCanvas.Math.Bound = new xCanvas.Math.Bound(0, 0, 0, 0);
    nodes.forEach((node: any) => {
      const url = require(`../../assets/${node.type}.png`);
      // const url = node.icon;
      const childLayer = new xCanvas.ImageLayer(url, node.x, node.y, size, size).addTo(stage);
      childLayer.setDirtyData(node);
      bound = bound ? bound.union(childLayer.getBound()) : childLayer.getBound();
    });
    this.center = bound.getCenter();
    stage.setView(this.center);
    stage.endBatch();
  }
  public leaveContainer() {
    bus.$emit(EventType.TIPVISIBLE, false);
  }
  public init() {
    if (!this.stage) {
      this.stage = new xCanvas.Stage('stage', {zoomChange: 0.1});
    }
    const size: number = 40;
    const helper = new TopoTreeHelper(this.stage, this.topoDatas, {size});
    helper.run();
    const stage: xCanvas.Stage = this.stage;
    stage.startBatch();
    this.stage.clearAllLayers();
    for (const edge of helper.edges) {
      const source = new xCanvas.Math.Vector2(edge.source.position.x, edge.source.position.y);
      const target = new xCanvas.Math.Vector2(edge.target.position.x, edge.target.position.y);
      const dir = target.clone().substract(source.clone()).normalize();
      const p1 = source.clone().add(dir.clone().scale(size / 1.5));
      const p2 = target.clone().substract(dir.clone().scale(size / 1.5));
      const pts: Vertex[] = [];
      pts.push([p1.x, p1.y], [p2.x, p2.y]);
      const leader = new xCanvas.Polyline(pts, {color: '#0276F7'});
      const arrow = new xCanvas.Polygon(this.getArrowData(pts[0], pts[1]), {color: '#0276F7', fillOpacity: 1});
      const group = new xCanvas.LayerGroup([leader, arrow]).addTo(stage);
    }
    let bound: xCanvas.Math.Bound = new xCanvas.Math.Bound(0, 0, 0, 0);
    for (const node of helper.nodes.values()) {
      const dirtyData = this.getDataByAlarmSourceName(node.name);
      let ex: string = '';
      if (dirtyData) {
        ex = '-Warning';
      }
      const url = require(`../../assets/${node.type}${ex}.png`);
      const childLayer = new xCanvas.ImageLayer(url, node.position.x, node.position.y, size, size).addTo(stage);
      if (dirtyData) {
        childLayer.setDirtyData({...dirtyData, type: node.type});
      }
      bound = bound ? bound.union(childLayer.getBound()) : childLayer.getBound();
    }
    this.center = bound.getCenter();
    stage.setView(this.center);
    stage.endBatch();
    this.clearEvent();
  }
  public resize() {
    const stage: xCanvas.Stage = this.stage;
  }
  /**
   * 根据网元名称获得告警信息
   */
  public getDataByAlarmSourceName(name: string) {
    const alarmItem = this.alarmDatas.find((alarm: AlarmData) => {
      return alarm.alarmSourceName === name;
    });
    return alarmItem;
  }
  public isAlarmNetWork(name: string) {
    return this.alarmDatas.find((alarmData: AlarmData) => {
      return alarmData.alarmName === name;
    });
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
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
    canvas {
      left: 0;
    }
  }
  .none-topoTree {
    position: relative;
    width: 100%;
    height: 100%;
    background-image: url('../../assets/none-topoTree.png');
    background-position: center 40%;
    background-size: 30% auto;
    background-repeat: no-repeat;
    .none-topoTree-label {
      position: absolute;
      left: 50%;
      top: 50%;
      margin-top: 12%;
      transform: translateX(-50%);
      font-family: PingFang-SC;
      font-size: 20px;
    }
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
