<template>
  <div class="app-container" :class="{none: isNoneData}">
    <el-scrollbar :native="false" wrapClass="app-scroll-wrap" viewClass="" :noresize="false" class="app-scroll">
      <Title></Title>
      <Importer></Importer>
      <div class="app-rca-body">
        <StaticsBoard></StaticsBoard>
        <transition name="fade">
          <div v-show="!isCheckStatics">
            <QueryTool></QueryTool>
            <div class="app-topo-tree">
              <TopoBoard></TopoBoard>
              <TopoTree></TopoTree>
            </div>
            <div class="app-topo-chart">
              <TopoChart v-show="!isNoneData"></TopoChart>
              <p class="app-topo-chart-none-label">暂无表格数据哦</p>
            </div>
            <div class="app-topo-pagination" v-if="!isNoneData">
              <TopoTablePagination></TopoTablePagination>
            </div>
          </div>
        </transition>
        <StaticsTable v-if="isCheckStatics"></StaticsTable>
      </div>
    </el-scrollbar>
    <ErrorDialog></ErrorDialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Provide } from "vue-property-decorator";
import { State } from 'vuex-class';
import Title from "@/views/Title/Index.vue";
import Importer from "@/views/Toolbars/Importer.vue";
import QueryTool from "@/views/Toolbars/QueryTool.vue";
import StaticsBoard from "./Board/Statics.vue";
import TopoBoard from "./Board/TopoBoard.vue";
import TopoTree from "./Topo/TopoTree.vue";
import TopoChart from './Topo/TopoChart.vue';
import TopoTablePagination from './Pagination/TopoPagination.vue';
import ErrorDialog from './Dialog/ErrorDialog.vue';
import StaticsTable from './Table/StaticsTable.vue';

@Component({
  components: {
    Title,
    Importer,
    QueryTool,
    StaticsBoard,
    TopoBoard,
    TopoTree,
    TopoChart,
    TopoTablePagination,
    ErrorDialog,
    StaticsTable,
  }
})
export default class AppMain extends Vue {
  @State((state) => state.app.isNonImported) private isNonImported!: boolean;
  @State((state) => state.app.isNoneData) private isNoneData: any;
  @State((state) => state.app.isCheckStatics) private isCheckStatics: any;
}
</script>

<style lang="scss">
.box-border {
  background: #ffffff;
  box-shadow: 0 4px 6px 0 rgba(186, 186, 186, 0.5);
  border-radius: 8px;
}
.app-container {
  position: relative;
  width: 100%;
  height: 100%;
  .app-scroll {
    height: 100%;
    background: #f8f9ff;
    .el-scrollbar__thumb {
      background-color: rgba(144,147,153,.1);
    }
  }
  .app-scroll-wrap {
    height: calc(100% - 30px);
    overflow-x: hidden;
  }
  .app-topo-chart-none-label {
    display: none;
  }
  &.none {
    .app-topo-chart {
      position: relative;
      background-image: url('../assets/none-topoChart.png');
      background-position: center 40%;
      background-size: 30% auto;
      background-repeat: no-repeat;
      .app-topo-chart-none-label {
        display: block;
        position: absolute;
        left: 50%;
        top: 50%;
        margin-top: 12%;
        transform: translateX(-50%);
        font-family: PingFang-SC;
        font-size: 24px;
      }
    }
    // .app-topo-pagination, .app-statics-pagination {
    //   display: none;
    // }
  }
  .app-rca-body {
    position: relative;
    height: calc(100% - 100px);
    padding: 0 25px;
    background: #f8f9ff;
    .app-topo-tree {
      position: relative;
      height: 650px;
      margin-top: 20px;
      @extend .box-border;
    }
    .app-topo-chart {
      margin-top: 20px;
      min-height: 500px;
      @extend .box-border;
    }
    .app-topo-pagination, .app-statics-pagination {
      margin-top: 20px;
      text-align: right;
    }
  }
}
</style>
