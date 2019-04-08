<template>
  <div class="app-stage" @mouseleave="leaveContainer">
    <div class="stage-wrap" id="stage">
      <div class="none-topoTree" v-if="isNoneData">
        <p class="none-topoTree-label" v-if="isNonImported">暂无任何数据哦</p>
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
import dJson from './data.json';
import { Node, VisibleType } from '../../types/type';
import * as util from '../../util/util';
import bus from '../../util/bus';
import TipDialog from '../Dialog/TipDialog.vue';
import cytoscape from 'cytoscape';
const { graphlib, dagre } = require('dagre-d3');
import ForceDirect from '@/util/force-direct';

@Component({
  components: {
    TipDialog,
  },
})
export default class TopoTree extends Vue {
  @Prop() private msg!: string;
  @Provide() private stage: any
  @Provide() private center: Vertex = [0, 0];
  @Provide() private cy: any;
  @State((state) => state.app.isNonImported) private isNonImported!: boolean;
  @State((state) => state.app.isNoneData) isNoneData: any;
  @State((state) => state.app.tableData) private tableData: any;
  @Watch('tableData')
  public watchTableData(val: any) {
    this.initTopoTree();
  }
  public initTopoTree() {
    if (!this.stage) {
      this.stage = new xCanvas.Stage('stage', {zoomChange: 0.1});
    }
    const g = new graphlib.Graph()
    g.setGraph({
      rankdir: 'BT',
      // align: 'dl', // 'dl、dr、ul、ur'
      ranksep: 80,
    });
    const mnodes = dJson.slice(0, this.tableData.length + 2).map((node: any, index: number) => {
      return {...node, ...this.tableData[index % this.tableData.length]};
    });
    for (const node of mnodes) {
      g.setNode(node.id, node)
    }
    for (const node of mnodes) {
      if (node.pId) {
        g.setEdge(node.pId, node.id, {source: g.node(node.pId), target: node});
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
  public initTopoTree1() {
    const images = [];
    images.push(require(`../../assets/pc.png`));
    images.push(require(`../../assets/router.png`));
    images.push(require(`../../assets/server.png`));
    images.push(require(`../../assets/switch.png`));
    this.cy = cytoscape({
      container: document.getElementById('stage'), 
      style: [
        { selector: 'node[label = "Person"]', 
          css: {'background-color': '#6FB1FC', 'content': 'data(name)'}
        },
        {
          selector: 'node',
          css: {'background-color': '#F5A45D', 'background-image': 'data(icon)', 'content': 'data(label)', 'background-fit': 'cover'}
        },
        { selector: 'edge', 
          css: {'target-arrow-shape': 'triangle'}
        }        
      ],
      elements: {
        nodes: [
          {data: {id: '172', name: 'Tom Cruise', label: '172', icon: images[0]}},
          {data: {id: '183', title: 'Top Gun', label: '183', icon: images[1]}},
          {data: {id: '184', title: 'Gun', label: '184', icon: images[2]}},
          {data: {id: '185', title: 'Gun183', label: '185', icon: images[3]}}
        ],
        edges: [
          {data: {source: '172', target: '183', relationship: 'Acted_In'}},
          {data: {source: '184', target: '185', relationship: 'Acted_In'}},
          {data: {source: '183', target: '185', relationship: 'Acted_In'}},
        ]
      },
      zoom: 1,
      minZoom: 0.1,
      maxZoom: 20,
      wheelSensitivity: 0.5,
      layout: { name: 'breadthfirst', rows: 1 }
    });
    console.log(this.cy);
    this.cy.on('click', (evt: any) => {
      console.log(evt.position);
    });
  }
  public initTopoTree2() {
    if (!this.stage) {
      this.stage = new xCanvas.Stage('stage', {zoomChange: 0.1});
    }
    const images = [];
    images.push(require(`../../assets/pc.png`));
    images.push(require(`../../assets/router.png`));
    images.push(require(`../../assets/server.png`));
    images.push(require(`../../assets/switch.png`));
    const nodes = [];
    for (let i = 0; i < 20; i++) {
      nodes.push({id: i, icon: images[i % 4]});
    }
    const edges = [];
    for (let i = 0; i < 10; i++) {
      edges.push({source: Math.floor(Math.random() * 20), target: Math.floor(Math.random() * 20)});
    }
    const force = new ForceDirect();
    for (const node of nodes) {
      force.setNode(node);
    }
    for (const edge of edges) {
      const source = force.getNode(edge.source);
      const target = force.getNode(edge.target);
      if (source && target) {
        force.setEdge({source, target});
      }
    }
    const data = force.run((nodes: any, edges: any) => {
      this.createNetWork(nodes, edges);
    });
    // this.createNetWork(data.nodes, data.edges);
    this.clearEvent();
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
        const dirtyData = layer.getDirtyData();
        window.location.hash = '#' + dirtyData.alarmName;
        this.$store.commit('SET_SELECTALARM', dirtyData.alarmName);
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
      bound = bound ? bound.expand(childLayer.getBound()) : childLayer.getBound();
    });
    this.center = bound.getCenter();
    stage.setView(this.center);
    stage.endBatch();
  }
  public leaveContainer() {
    bus.$emit(VisibleType.TIPVISIBLE, false);
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
      font-size: 24px;
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
