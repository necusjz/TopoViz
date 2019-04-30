<template>
  <div class="rca-statics-board" :class="{'rca-statics-view': isCheckStatics}">
    <div class="rca-dec blue-text" v-if="isCheckStatics">
      <i class="el-icon-warning"></i>
      <span class="rca-waring-dec">提示：只有当前数据的所有 Group ID 都确认过时才可得出 RCA 准确率哦</span>
    </div>
    <div class="statics-board" v-else>
      <p class="statics-title">{{$t('lang.rcaResultStatics')}}</p>
      <el-row class="statics-board-row">
        <el-col :span="11" class="board-col board-left">
          <div class="board-col-item">
            <span class="board-count orange-text">{{total_count}}</span>
            <span>总告警</span>
          </div>
          <div class="board-col-item">
            <span class="board-count">{{p_count}}</span>
            <span>P 告警</span>
          </div>
          <div class="board-col-item">
            <span class="board-count">{{c_count}}</span>
            <span>C 告警</span>
          </div>
          <div class="board-col-item">
            <span class="board-count">{{x_count}}</span>
            <span>未知告警</span>
          </div>
        </el-col>
        <el-col :span="13" class="board-col">
          <div class="board-col-item">
            <span class="board-count">{{group_count}}</span>
            <span>组数量</span>
          </div>
          <div class="board-col-item">
            <span class="board-count blue-text">{{confirmed_count}}</span>
            <span>已确认组</span>
          </div>
          <div class="board-col-item">
            <span class="board-count" style="color: #ff686f">{{unconfirmed_count}}</span>
            <span>未确认组</span>
          </div>
          <el-popover
            placement="top"
            width="120"
            trigger="hover"
            v-if="unconfirmed_count > 0">
            <span class="blue-text">提示：</span>
            <span>只有当前数据的所有 Group ID 都处理过时才可得出 RCA 准确率哦</span>
            <div class="board-col-item board-precision" slot="reference">
              <span class="board-count">{{accuracy}}</span>
              <span>RCA 准确率</span>
            </div>
          </el-popover>
          <div class="board-col-item" v-else>
            <span class="board-count">{{accuracy}}</span>
            <span>RCA 准确率</span>
          </div>
          <div class="board-col-item" v-if="unconfirmed_count > 0 && unconfirmed_count !== group_count" @click="checkStatics">
            <i class="el-icon-arrow-right board-viewer-icon"></i>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide } from "vue-property-decorator";
import { State } from 'vuex-class';
@Component
export default class StaticsBoard extends Vue {
  @State((state) => state.app.isCheckStatics) private isCheckStatics!: boolean;
  @State((state) => state.project.total_count) private total_count!: number;
  @State((state) => state.project.p_count) private p_count!: number;
  @State((state) => state.project.c_count) private c_count!: number;
  @State((state) => state.project.group_count) private group_count!: number;
  @State((state) => state.project.confirmed_count) private confirmed_count!: number;
  @State((state) => state.project.unconfirmed_count) private unconfirmed_count!: number;
  @State((state) => state.project.accuracy) private accuracy!: string;
  @State((state) => state.project.x_count) private x_count!: number;
  public checkStatics() {
    this.$store.commit('SET_ISCHECKSTATICS', true);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
.rca-statics-board {
  font-size: 16px;
  color: #000000;
  line-height: 20px;
  text-align: left;
  display: flex;
  justify-content: space-between;
  border-radius: 8px;
  box-shadow: 0 4px 6px 0 rgba(186, 186, 186, 0.5);
  background-color: #ffffff;
  .statics-board {
    width: 100%;
    .statics-title {
      padding-left: 20px;
      line-height: 40px;
      border-bottom: 1px solid #dfdfdf;
    }
    .statics-board-row {
      padding: 25px 20px 20px;
      max-width: 1440px;
      margin: 0 auto;
      .board-left {
        border-right: 1px solid #dfdfdf;
      }
      .board-col {
        display: flex;
        justify-content: space-around;
        .board-col-item{
          display: flex;
          flex-direction: column;
          text-align: center;
        }
        .board-precision {
          cursor: pointer;
        }
        .board-count {
          font-size: 26px;
          font-weight: 500;
          padding-bottom: 10px;
        }
        .board-viewer-icon {
          line-height: 50px;
          font-size: 36px;
          color: #979797;
          cursor: pointer;
        }
      }
    }
  }
}
.rca-waring-dec {
  padding-left: 15px;
}
.rca-statics {
  display: inline-block;
  transition: opacity 0.3;
}
.dec-group {
  text-decoration: underline;
  cursor: pointer;
  &:hover {
    color: #338AFF;
  }
}
.statics-precision {
  padding-right: 5px;
  color: #282828;
}
.rca-statics-view {
  line-height: 40px;
  background-color: transparent;
  box-shadow: none;
}
</style>
