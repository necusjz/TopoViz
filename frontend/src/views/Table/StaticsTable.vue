<template>
  <div class="statics-table">
    <el-row class="statics-table-row">
      <el-col :span="12">未确认</el-col>
      <el-col :span="12">已确认</el-col>
    </el-row>
    <div class="statics-subtable">
      <div class="statics-left-subtable sub">
        <SubTable :tableData="data2"></SubTable>
      </div>
      <div class="statics-right-subtable sub">
        <SubTable :tableData="data1"></SubTable>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import SubTable from "./SubTable.vue";
import { AlarmData } from '@/types/type';

@Component({
  components: {
    SubTable
  }
})
export default class StaticsTable extends Vue {
    @Provide() private data1 = [];
    @Provide() private data2 = [];
    @State((state) => state.app.alarmDatas) private alarmDatas: any;
    mounted() {
        this.data1 = this.alarmDatas.filter((alarmData: AlarmData) => alarmData.isConfirmed).map((alarmData: AlarmData) => {
            return {groupId: alarmData.groupId, precision: '80%'};
        });
        this.data2 = this.alarmDatas.filter((alarmData: AlarmData) => !alarmData.isConfirmed).map((alarmData: AlarmData) => {
            return {groupId: alarmData.groupId, precision: '--'};
        });
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
$Gray-border: 1px solid #f8f9ff;
.statics-table {
  border-radius: 8px;
  box-shadow: 0 4px 6px 0 rgba(186, 186, 186, 0.5);
  background-color: #ffffff;
  .statics-table-row {
    line-height: 60px;
    box-sizing: border-box;
    border-bottom: $Gray-border;
  }
  .statics-subtable {
    display: flex;
    .sub {
        flex: 1;
    }
  }
  .statics-left-subtable {
    border-right: $Gray-border;
  }
}
</style>
