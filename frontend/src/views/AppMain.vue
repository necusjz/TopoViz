<template>
  <div class="app-container">
    <el-scrollbar :native="false" wrapClass="app-scroll-wrap" viewClass="" :noresize="false" class="app-scroll">
      <Title></Title>
      <Importer></Importer>
      <div class="app-rca-body">
        <StaticsBoard class="app-item"></StaticsBoard>
        <transition name="fade">
          <div v-show="!isCheckStatics">
            <QueryTool class="app-item"></QueryTool>
            <div class="app-topo-tree">
              <TopoBoard></TopoBoard>
              <TopoTree></TopoTree>
            </div>
            <div class="app-topo-chart" :class="{none: isNoneTableData}">
              <TopoChart v-show="!isNoneTableData"></TopoChart>
              <p class="app-topo-chart-none-label">暂无任何数据展示哦，导入 RCA 结果试试。</p>
            </div>
            <div class="app-topo-pagination" v-if="!isNoneTableData">
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
import TopoTree from "./Topo/TopoTree1.vue";
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
  @State((state) => state.app.isNonImported) public isNonImported!: boolean;
  @State((state) => state.app.isNoneTopoData) public isNoneTopoData!: boolean;
  @State((state) => state.app.isNoneTableData) public isNoneTableData!: boolean;
  @State((state) => state.app.isCheckStatics) public isCheckStatics!: boolean;
}
</script>

<style lang="scss">
.box-border {
  background: #ffffff;
  box-shadow: 0 4px 6px 0 rgba(186, 186, 186, 0.5);
  border-radius: 8px;
}
.app-item {
  margin-top: 20px;
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
  .app-rca-body {
    position: relative;
    height: calc(100% - 100px);
    padding: 0 20px;
    background: #f8f9ff;
    .app-topo-tree {
      position: relative;
      height: 650px;
      margin-top: 20px;
      @extend .box-border;
    }
    .app-topo-chart {
      margin-top: 20px;
      @extend .box-border;
      &.none {
        position: relative;
        background-image: url('../assets/none-topoChart.png');
        background-position: center 40%;
        background-size: 290px 190px;
        background-repeat: no-repeat;
        min-height: 600px;
        .app-topo-chart-none-label {
          display: block;
          position: absolute;
          left: 50%;
          top: 50%;
          margin-top: 8%;
          transform: translateX(-50%);
          font-family: PingFang-SC;
          font-size: 20px;
        }
      }
    }
    .app-topo-pagination, .app-statics-pagination {
      margin-top: 20px;
      text-align: right;
    }
  }
}
</style>
