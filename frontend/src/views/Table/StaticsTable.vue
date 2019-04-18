<template>
  <div class="statics-table">
    <el-row class="statics-table-row">
      <el-col :span="12">未确认</el-col>
      <el-col :span="12">已确认</el-col>
    </el-row>
    <div class="statics-subtable">
      <div class="statics-left-subtable sub">
        <SubTable :tableData="unconfirmData"></SubTable>
      </div>
      <div class="statics-right-subtable sub">
        <SubTable :tableData="confirmData"></SubTable>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import SubTable from "./SubTable.vue";
import { AlarmData, StaticsRes } from '@/types/type';
import { getStaticsGroupData } from '@/api/request';

@Component({
  components: {
    SubTable
  }
})
export default class StaticsTable extends Vue {
    @Provide() private confirmData: string[] = [];
    @Provide() private unconfirmData: string[] = [];
    @State((state) => state.app.alarmDatas) private alarmDatas: any;
    created() {
      getStaticsGroupData().then((res) => {
        if (res) {
          this.confirmData = res.confirmed;
          this.unconfirmData = res.unconfirmed;
        }
      });
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
$Gray-border: 1px solid #f8f9ff;
.statics-table {
  margin-top: 20px;
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
