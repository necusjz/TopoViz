<template>
  <el-pagination
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
    :current-page="currentPage"
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
    @Provide() private pageSize: number = 10;
    @Provide() private pageSizes: number[] = [5, 10, 15];
    @Provide() private totalSize: number = 0;
    @State((state) => state.app.tableData) private tableData: any;
    @Watch('tableData')
    public watchTableData(val: AlarmData[]) {
      this.initPagination();
    }
    public initPagination() {
      this.currentPage = 1;
      this.totalSize = this.tableData.length;
      this.submitPageData();
    }
    public handleSizeChange(size: number) {
      this.pageSize = size;
      if (this.currentPage > size) {
        this.currentPage = size;
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
}
</script>
