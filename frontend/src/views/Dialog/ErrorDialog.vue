<template>
  <el-dialog :visible="dialogVisible" custom-class="error-dialog" width="380px" :show-close="false">
    <div class="dialog-title" slot="title">
      <div class="title-label">
        <i class="el-icon-warning"></i>
        <span class="label">{{errorTitle}}</span>
      </div>
      <div class="title-close" @click="closeDialog">
        <i class="el-icon-close"></i>
      </div>
    </div>
    <div class="dialog-content">
      <div class="error-content-box" v-html="errorHtml"></div>
      <el-button size="small" type="primary" class="confirm-btn" @click="closeDialog">确定</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide } from "vue-property-decorator";
import { EventType } from "../../types/type";
import bus from "../../util/bus";
@Component
export default class ErrorDialog extends Vue {
  @Provide() private dialogVisible: boolean = false;
  @Provide() private errorHtml: string = "";
  @Provide() private errorTitle: string = "错误提示";
  mounted() {
    bus.$on(EventType.ERRORVISIBLE, (obj: string | {title: string, content: string}) => {
      this.dialogVisible = true;
      if (typeof obj === 'string') {
        this.errorHtml = obj;
      } else {
        this.errorTitle = obj.title;
        this.errorHtml = obj.content;
      }
    });
  }
  public closeDialog() {
      this.dialogVisible = false;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
.error-dialog {
  .el-dialog__header {
    padding: 0;
  }
  .el-dialog__body {
    padding: 20px 40px;
  }
}
.dialog-title {
  height: 50px;
  background: #348aff;
  color: #ffffff;
  line-height: 50px;
  display: flex;
  justify-content: space-between;
  padding: 0 15px;
  .title-label {
    font-size: 20px;
    .label {
      padding-left: 10px;
    }
  }
  .title-close {
    cursor: pointer;
    &:hover {
      opacity: 0.6;
    }
  }
}
.error-content-box {
  padding-bottom: 20px;
  color: #282828;
  text-align: center;
  p {
    display: inline-block;
    text-align: left;
  }
}
</style>
