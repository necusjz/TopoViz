<template>
  <el-pagination
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
    :current-page.sync="currentPage"
    :page-sizes="pageSizes"
    :page-size="pageSize"
    layout="total, sizes, prev, pager, next, jumper"
    :total="totalSize"
  ></el-pagination>
</template>

<script lang="ts">
import { Component, Vue, Provide, Watch } from "vue-property-decorator";
import { State } from 'vuex-class';
import { AlarmData } from '@/types/type';

@Component
export default class TopoTablePagination extends Vue {
    @Provide() private currentPage: number = 1;
    @Provide() private pageSize: number = 5;
    @Provide() private pageSizes: number[] = [5, 10, 15];
    @Provide() private totalSize: number = 0;
    @State((state) => state.app.tableData) private tableData!: AlarmData[];
    @State((state) => state.app.selectAlarm) private selectAlarm!: string;
    @State((state) => state.app.pageData) private pageData!: AlarmData[];
    @State((state) => state.app.alarmDatas) private alarmDatas!: AlarmData[];
    @Watch('tableData')
    public watchTableData(val: AlarmData[]) {
      this.initPagination();
    }
    @Watch('selectAlarm')
    public watchSelectAlarm(val: string) {
      this.forwardTargetPage();
    }
    public initPagination() {
      this.totalSize = this.tableData.length;
      if (this.currentPage > Math.ceil(this.totalSize / this.pageSize)) {
        this.currentPage = 1;
      } 
      this.submitPageData();
    }
    public handleSizeChange(size: number) {
      this.pageSize = size;
      if (this.currentPage > Math.ceil(this.totalSize / size)) {
        this.currentPage = 1;
      } else {
        this.submitPageData();
      }
    }
    public handleCurrentChange(page: number) {
      this.currentPage = page;
      this.submitPageData();
    }
    public submitPageData() {
      const currentPageData: AlarmData[] = this.tableData.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
      this.$store.commit('SET_PAGEDATA', currentPageData);
    }
    public forwardTargetPage() {
      const index = this.tableData.findIndex((alarmData) => alarmData.alarmSourceName === this.selectAlarm);
      if (index > -1) {
        this.currentPage = Math.ceil((index + 1) / this.pageSize);
        this.$store.commit('SET_ALARMDATAS', [...this.alarmDatas]);
      }
    }
}
</script>
