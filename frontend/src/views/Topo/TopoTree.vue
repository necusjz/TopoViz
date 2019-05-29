<template>
  <div class="app-stage" @mouseleave="leaveContainer">
    <QueryTool></QueryTool>
    <div class="stage-wrap" id="stage" ref="stage">
      <div class="none-topoTree" v-if="isNoneTopoData">
        <p class="none-topoTree-label" v-if="isNonImported">No topology display, try importing RCA results.</p>
        <p class="none-topoTree-label" v-else>No topology display, try importing RCA results.</p>
      </div>
      <div class="topo-legend" v-if="!isNoneTopoData">
        <div class="legend-item">
          <i class="legend-red-tag legend-tag"></i>
          <span class="legend-text">{{$t('lang.pNumber')}}</span>
        </div>
        <div class="legend-item">
          <i class="legend-green-tag legend-tag"></i>
          <span class="legend-text">{{$t('lang.cNumber')}}</span>
        </div>
        <div class="legend-item">
          <i class="legend-blue-tag legend-tag"></i>
          <span class="legend-text">{{$t('lang.xNumber')}}</span>
        </div>
      </div>
    </div>
    <div class="stage-toolbar">
      <div class="stage-toolbar-item" @click="zoom(1)">
        <i class="el-icon-plus"></i>
      </div>
      <div class="stage-toolbar-item" @click="zoom(-1)">
        <i class="el-icon-minus"></i>
      </div>
      <div class="stage-toolbar-item" @click="fullScreen">
        <i class="stage-fullScreen"></i>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide, Watch } from 'vue-property-decorator';
import { State } from 'vuex-class';
import * as xCanvas from '../../lib';
import { Node, Edge, EventType, AlarmData, NodeData, RCAResult } from '../../types/type';
import * as util from '../../util/util';
import bus from '../../util/bus';
import TipDialog from '../Dialog/TipDialog.vue';
import QueryTool from '../Toolbars/QueryTool.vue';
import TopoTreeHelper from '@/util/topoTree';
import { EventData, Vertex } from '../../lib/typeof/typeof';

declare const ht: any;

@Component({
  components: {
    TipDialog,
    QueryTool,
  },
})
export default class TopoTree extends Vue {
  @Provide() private stage!: xCanvas.Stage;
  @Provide() private borderLayer!: xCanvas.Layer;
  @Provide() private size: number = 60;
  @Provide() private bound?: xCanvas.Math.Bound | undefined;
  @State((state) => state.app.isNonImported) private isNonImported!: boolean;
  @State((state) => state.app.isNoneTopoData) isNoneTopoData: any;
  @State((state) => state.app.alarmDatas) private alarmDatas!: AlarmData[];
  @State((state) => state.app.topoDatas) private topoDatas!: NodeData[][];
  @State((state) => state.app.selectAlarm) private selectAlarm!: string;
  @Watch('topoDatas')
  public watchTopoDatas(val: NodeData[][]) {
    this.buildTopoTree();
  }
  @Watch('selectAlarm')
  public watchSlectAlarm(val: string) {
    this.selectNetwork();
  }
  mounted() {
    bus.$on(EventType.NETWORKFILTER, (neNames: string[], type: string = 'Red') => {
      this.updateAlarmImg(neNames, type);
    });
    bus.$on(EventType.RESETREDALARM, () => {
      this.reset();
    });
    bus.$on(EventType.CLEARALARMNET, (noGroupAlarmsSet: Set<string>) => {
      this.clearAlarmNet(noGroupAlarmsSet);
    });
    bus.$on(EventType.CLEARALL, () => {
      if (this.stage) {
        this.stage.clearAllLayers();
      }
    });
    window.addEventListener('resize', util.throttle(() => {
      if (this.stage && this.bound) {
        this.stage.forceRender(this.bound.getCenter());
      }
    }, 300, true));
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
  public fullScreen() {
    if (this.stage && this.bound) {
      this.stage.fitBound(this.bound);
    }
  }
  public addEvents() {
    const stage: xCanvas.Stage = this.stage;
    stage.clearAllEvents();
    stage.on('mousemove', util.throttle((e: any) => {
      const layer = stage.getLayerByPosition(e.pos);
      if (layer && layer.options.type !== 'tag') {
        stage.clearHighLightLayer();
        if (layer.options.type === 'node') {
          layer.highLight({shadow: true});
        } else {
          layer.highLight();
        }
        stage.hilightLayers();
      } else {
        stage.clearHighLightLayer();
      }
    }, 100));
    stage.on('mousedown', (e: EventData) => {
      const layer = stage.getLayerByPosition(e.pos);
      if (layer && layer.options.layerType === 'node') {
        stage.disableDrag();
        let startPos = e.pos;
        stage.on('mousemove', (ev: EventData) => {
          this.clearBorderlayer();
          stage.startBatch()
          const endPos = ev.pos;
          const dx = endPos[0] - startPos[0];
          const dy = endPos[1] - startPos[1];
          layer.translate(dx, dy);
          this.updateRelateLayers(dx, dy, layer.options.name);
          startPos = endPos;
          stage.endBatch();
        });
        stage.once('mouseup', (et: EventData) => {
          if (xCanvas.Math.Base.isSamePoint(et.pos, e.pos)) {
            this.locationTableAlarm(et.pos);
          }
          stage.off('mousemove');
        })
      }
    });
  }
  public locationTableAlarm(pos: Vertex) {
    const layers = this.stage.getLayersByPosition(pos);
    const layer = layers.find((layer: xCanvas.Layer) => layer.options.layerType === 'node');
    if (layer) {
      const dirtyData = layer.getDirtyData();
      if (dirtyData) {
        window.location.hash = '#' + dirtyData.alarmSourceName;
        this.$store.commit('SET_SELECTALARM', dirtyData.alarmSourceName);
        setTimeout(() => {
          window.location.hash = '';
        });
      }
    } else {
      this.clearBorderlayer();
    }
  }
  public clearBorderlayer() {
    if (this.borderLayer) {
      this.stage.removeLayer(this.borderLayer);
      this.$store.commit('SET_SELECTALARM', '');
    }
  }
  public updateRelateLayers(dx: number, dy: number, name: string) {
    this.stage.eachLayer((layer: xCanvas.Layer) => {
      if (layer.options.layerType === 'edge') {
        console.log('edge');
        layer.translate(dx, dy);
      } else if (layer.options.layerType === 'tag' && layer.options.name === name) {
        layer.translate(dx, dy);
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
      this.stage.setView(bound.getCenter());
    }
  }
  public getArrowData(v1: Vertex, v2: Vertex): Vertex[] {
    const p = new xCanvas.Math.Vector2(v1);
    const q = new xCanvas.Math.Vector2(v2);
    const dir = new xCanvas.Math.Vector2(q.x - p.x, q.y - p.y);
    const oppositDir = dir.clone().rotate(180).normalize();
    const angle = 60;
    const len = 10;
    const p1 = q.clone().add(oppositDir.clone().rotate(angle / 2).scale(len));
    const p2 = q.clone().add(oppositDir.clone().rotate(-angle / 2).scale(len));
    return [v2, [p1.x, p1.y], [p2.x, p2.y]];
  }
  public leaveContainer() {
    bus.$emit(EventType.TIPVISIBLE, false);
  }
  public buildTopoTree() {
    this.bound = undefined;
    if (!this.stage) {
      this.stage = new xCanvas.Stage('stage', {zoomChange: 0.1, zoom: 1});
    }
    this.stage.clearAllLayers();
    if (!this.topoDatas) {
      return;
    }
    const step: number = 250;
    const stageDom: any = this.$refs.stage;
    const width: number = stageDom.offsetWidth;
    const height: number = stageDom.offsetHeight;
    const helper = new TopoTreeHelper(this.topoDatas, {size: this.size, width, height, step});
    helper.run();
    const stage: xCanvas.Stage = this.stage;
    stage.startBatch();
    for (const edge of helper.edges) {
      const source = new xCanvas.Math.Vector2(edge.source.position.x, edge.source.position.y);
      const target = new xCanvas.Math.Vector2(edge.target.position.x, edge.target.position.y);
      const path = [];
      if (edge.source.type ===  edge.target.type && helper.isStraight(source.x, target.x, edge.source.type)) {
        const ydir = new xCanvas.Math.Vector2(0, -1);
        const p1 = source.clone().add(ydir.clone().scale(this.size / 1.8));
        const p2 = target.clone().add(ydir.clone().scale(this.size / 1.8));
        const p3 = p1.clone().add(ydir.clone().scale(step / 3));
        const p4 = new xCanvas.Math.Vector2(p2.x, p3.y);
        path.push([p1.toArray(), p3.toArray(), p4.toArray(), p2.toArray()]);
        const leader = new xCanvas.Polyline(path, {color: '#0276F7', layerType: 'edge-line'});
        const arrow = new xCanvas.Polygon(this.getArrowData(p4.toArray(), p2.toArray()), {color: '#0276F7', fillOpacity: 1, layerType: 'edge-arrow'});
        stage.addLayer(new xCanvas.LayerGroup([leader, arrow], {layerType: 'edge', sourceName: edge.source.name, targetName: edge.target.name}));
      } else {
        const dir = target.clone().substract(source.clone()).normalize();
        const p1 = source.clone().add(dir.clone().scale(this.size / 1.5));
        const p2 = target.clone().substract(dir.clone().scale(this.size / 1.5));
        const pts: Vertex[] = [];
        pts.push([p1.x, p1.y], [p2.x, p2.y]);
        const leader = new xCanvas.Polyline(pts, {color: '#0276F7', layerType: 'edge-line'});
        const arrow = new xCanvas.Polygon(this.getArrowData(pts[0], pts[1]), {color: '#0276F7', fillOpacity: 1, layerType: 'edge-arrow'});
        stage.addLayer(new xCanvas.LayerGroup([leader, arrow], {layerType: 'edge', sourceName: edge.source.name, targetName: edge.target.name}));
      }
    }
    for (const node of helper.nodes.values()) {
      let dirtyData = this.getDataByAlarmSourceName(node.name);
      if (dirtyData) {
        dirtyData = {...dirtyData, type: node.type};
        dirtyData.statusType = node.color;
      }
      const ex: string = dirtyData ? `-${dirtyData.statusType}` : '';
      const url = require(`../../assets/${node.type}${ex}.png`);
      const nodeLayer = new xCanvas.ImageLayer(url, node.position.x, node.position.y, this.size, this.size, {layerType: 'node', name: node.name}).addTo(stage);
      if (dirtyData) {
        nodeLayer.setDirtyData(dirtyData);
        // this.addAlarmCountTag(nodeLayer, node.name);
      }
      this.addAlarmCountTag(nodeLayer, node.name);
      this.bound = this.bound ? this.bound.union(nodeLayer.getBound()) : nodeLayer.getBound();
    }
    if (this.bound) {
      stage.fitBound(this.bound);
    }
    stage.endBatch();
    this.addEvents();
  }
  public addAlarmCountTag(nodeLayer: xCanvas.Layer, alarmSourceName: string) {
    const bound = nodeLayer.getBound().expand(4);
    const base: xCanvas.Math.Vector2 = new xCanvas.Math.Vector2(bound.getCenter());
    const vec: xCanvas.Math.Vector2 = new xCanvas.Math.Vector2(1, 1).normalize().scale(this.size * 0.8);
    const topRight = base.clone().add(vec);
    const top = base.clone().add(new xCanvas.Math.Vector2(0, 1).scale(this.size / 2 + 16));
    const topLeft = base.clone().add(new xCanvas.Math.Vector2(-1, 1).normalize().scale(this.size * 0.8));
    const pts: xCanvas.Math.Vector2[] = [top, topRight, topLeft];
    const nums: {text: string, icon: string}[] = [];
    const alarmDatas = this.alarmDatas.filter((alarmData) => alarmData.alarmSourceName === alarmSourceName);
    const pCount = alarmDatas.filter((alarmData) => alarmData.rcaResult_edit === RCAResult.P).length;
    if (pCount > 0) {
      nums.push({text: pCount.toString(), icon: 'red'});
    }
    const xCount = alarmDatas.filter((alarmData) => !alarmData.groupId_edit).length;
    if (xCount > 0) {
      nums.push({text: xCount.toString(), icon: 'blue'});
    }
    const cCount = alarmDatas.length - pCount - xCount;
    if (cCount > 0) {
      nums.push({text: cCount.toString(), icon: 'green'});
    }
    const layerGroup: xCanvas.LayerGroup = new xCanvas.LayerGroup([], {layerType: 'tag', name: alarmSourceName});
    nums.forEach((tag, index) => {
      const dir = index === 0 ? 'center': index === 1 ? 'right' : 'left';
      const tagUrl = require(`../../assets/${tag.icon}-${dir}-tag.png`);
      const tagPos = [pts[index].x, pts[index].y];
      // 添加告警数量tag
      const tagImage = new xCanvas.ImageLayer(tagUrl, tagPos[0], tagPos[1], 28, 20, {layerType: 'tag'});
      layerGroup.addLayer(tagImage);
      // this.stage.addLayer(tagImage);
      const tagText = new xCanvas.IText(pts[index].toArray(), tag.text, {color: '#FFFFFF', textAlign: 'center'});
      layerGroup.addLayer(tagText);
      // this.stage.addLayer(new xCanvas.IText(pts[index].toArray(), tag.text, {color: '#FFFFFF', textAlign: 'center'}));
      if (this.bound) {
        this.bound = this.bound.union(tagImage.getBound());
      }
    });
    const textPos = base.clone().add(new xCanvas.Math.Vector2(0, -1).scale(this.size / 1.5)).toArray();
    const maxLength = 120;
    const iText = new xCanvas.IText([textPos[0], textPos[1]], alarmSourceName,
      {color: '#282828', textAlign: 'center', baseLine: 'top', maxLength, verticleSpace: 8, fontSize: 10});
    layerGroup.addLayer(iText);
    // this.stage.addLayer(iText);
    this.stage.addLayer(layerGroup);
    if (this.bound) {
      this.bound = this.bound.union(iText.getBound());
    }
  }
  public reset() {
    this.stage.startBatch();
    this.stage.eachLayer((layer: xCanvas.Layer) => {
      if (layer.getLayerType() === 'IMAGE') {
        const dirtyData = layer.getDirtyData();
        if (dirtyData) {
          const url = require(`../../assets/${dirtyData.type}-${dirtyData.statusType}.png`);
          (layer as xCanvas.ImageLayer).setImage(url);
        }
      }
    });
    this.stage.endBatch();
  }
  public clearAlarmNet(noGroupAlarms: Set<string>) {
    this.stage.startBatch();
    this.stage.eachLayer((layer: xCanvas.Layer) => {
      if (layer.getLayerType() === 'IMAGE') {
        const dirtyData = layer.getDirtyData();
        if (dirtyData && noGroupAlarms.has(dirtyData.alarmSourceName)) {
          const url = require(`../../assets/${dirtyData.type}.png`);
          (layer as xCanvas.ImageLayer).setImage(url);
          delete layer.dirtyData;
        }
      }
    });
    this.stage.endBatch();
  }
  public updateAlarmImg(neNames: string[], type: string) {
    this.stage.startBatch();
    this.stage.eachLayer((layer: xCanvas.Layer) => {
      if (layer.getLayerType() === 'IMAGE') {
        const dirtyData = layer.getDirtyData();
        if (!dirtyData) return;
        let url: string = '';
        if (neNames.includes(dirtyData.alarmSourceName)) {
          url = require(`../../assets/${dirtyData.type}-Red.png`);
          (layer as xCanvas.ImageLayer).setImage(url);
        } else {
          url = require(`../../assets/${dirtyData.type}-${dirtyData.statusType}.png`);
        }
        (layer as xCanvas.ImageLayer).setImage(url);
      }
    });
    this.stage.endBatch();
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
  public isPAlarm(name: string): boolean {
    return !!this.alarmDatas.filter((alarmData: AlarmData) => {
      return alarmData.alarmSourceName === name;
    }).find((alarmData: AlarmData) => alarmData.rcaResult_edit === RCAResult.P);
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
    .topo-legend {
      position: absolute;
      width: 120px;
      bottom: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.3);
      padding: 8px 5px;
      display: flex;
      flex-direction: column;
      z-index: 5;
      border-radius: 4px;
      .legend-item {
        display: flex;
        align-items: center;
        line-height: 30px;
        font-size: 12px;
      }
    }
  }
  .none-topoTree {
    position: relative;
    width: 100%;
    height: 100%;
    background-image: url('../../assets/none-topoTree.png');
    background-position: center 40%;
    background-size: 290px 190px;
    background-repeat: no-repeat;
    .none-topoTree-label {
      position: absolute;
      left: 50%;
      top: 50%;
      margin-top: 8%;
      transform: translateX(-50%);
      font-family: PingFang-SC;
      font-size: 20px;
    }
  }
  .stage-toolbar {
    position: absolute;
    top: 60px;
    right: 20px;
    height: 120px;
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
      background: #fff;
      &:hover {
        color: #409EFF;
      }
    }
    .stage-fullScreen {
      display: inline-block;
      width: 24px;
      height: 24px;
      vertical-align: middle;
      background-image: url('../../assets/fullScreen.jpg');
      background-size: cover;
    }
    .stage-toolbar-item:active {
      box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);
    }
  }
  .legend-tag {
    display: inline-block;
    width: 14px;
    height: 14px;
    background-size: contain;
    background-repeat: no-repeat;
  }
  .legend-red-tag {
    background-image: url('../../assets/red-left-tag.png');
  }
  .legend-green-tag {
    background-image: url('../../assets/green-left-tag.png');
  }
  .legend-blue-tag {
    background-image: url('../../assets/blue-left-tag.png');
  }
  .legend-text {
    padding-left: 10px;
  }
}
</style>
