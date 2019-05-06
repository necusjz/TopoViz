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
import { AlarmData, EventType } from '@/types/type';
import bus from '@/util/bus';

@Component
export default class TopoTablePagination extends Vue {
    @Provide() public currentPage: number = 1;
    @Provide() public pageSize: number = 10;
    @Provide() public pageSizes: number[] = [10, 20, 30];
    @Provide() public totalSize: number = 0;
    @State((state) => state.app.tableData) public tableData!: AlarmData[];
    @State((state) => state.app.selectAlarm) public selectAlarm!: string;
    @State((state) => state.app.pageData) public pageData!: AlarmData[];
    @State((state) => state.app.alarmDatas) public alarmDatas!: AlarmData[];
    @State((state) => state.app.needSave) public needSave!: boolean;
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
      if (this.needSave) {
        bus.$emit(EventType.ERRORVISIBLE, {
          title: '错误提示',
          content: '<p>当前结果未保存，您确定要离开吗？</p>',
          confirmCallback: () => {
            this.$store.commit('SET_NEEDSAVE', false);
            this.pageSize = size;
            if (this.currentPage > Math.ceil(this.totalSize / size)) {
              this.currentPage = 1;
            } else {
              this.submitPageData();
            }
          },
          saveCallback: () => {
            bus.$emit(EventType.SAVEDATA);
          }
        });
      } else {
        this.pageSize = size;
        if (this.currentPage > Math.ceil(this.totalSize / size)) {
          this.currentPage = 1;
        } else {
          this.submitPageData();
        }
      }
    }
    public handleCurrentChange(page: number) {
      if (this.needSave) {
        bus.$emit(EventType.ERRORVISIBLE, {
          title: '错误提示',
          content: '<p>当前结果未保存，您确定要离开吗？</p>',
          confirmCallback: () => {
            this.$store.commit('SET_NEEDSAVE', false);
            this.currentPage = page;
            this.submitPageData();
          },
          saveCallback: () => {
            bus.$emit(EventType.SAVEDATA);
          }
        });
      } else {
        this.currentPage = page;
        this.submitPageData();
      }
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
