<template>
  <el-dialog :visible="dialogVisible" custom-class="error-dialog" width="380px" :show-close="false">
    <div class="dialog-title" slot="title" :class="type === 'error' ? 'dialog-error' : ''">
      <div class="title-label">
        <i class="el-icon-warning"></i>
        <span class="label">{{errorTitle}}</span>
      </div>
      <div class="title-close" @click="cancel">
        <i class="el-icon-close"></i>
      </div>
    </div>
    <div class="dialog-content">
      <div class="error-content-box" v-html="errorHtml"></div>
      <el-button size="small" class="save-btn" v-if="showSaveBtn" @click="save">保存</el-button>
      <el-button size="small" type="primary" class="confirm-btn" :class="{error: type === 'error'}" @click="confirm">确定</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide } from "vue-property-decorator";
import { EventType } from "../../types/type";
import bus from "../../util/bus";
interface RecieveData {
  title: string;
  content: string;
  type?: string;
  saveCallback?: any;
  confirmCallback?: any;
  cancelCallback?: any;
}
@Component
export default class ErrorDialog extends Vue {
  @Provide() private dialogVisible: boolean = false;
  @Provide() private type: string = 'info';
  @Provide() private errorHtml: string = "";
  @Provide() private errorTitle: string = "Error";
  @Provide() private showSaveBtn: boolean = false;
  @Provide() private saveCallback?: any;
  @Provide() private confirmCallback?: any;
  @Provide() private cancelCallback?: any;
  mounted() {
    bus.$on(EventType.ERRORVISIBLE, (obj: string | RecieveData) => {
      this.dialogVisible = true;
      if (typeof obj === 'string') {
        this.errorHtml = obj;
        this.showSaveBtn = false;
      } else {
        this.type = obj.type || 'info';
        this.errorTitle = obj.title;
        this.errorHtml = obj.content;
        this.saveCallback = obj.saveCallback;
        this.confirmCallback = obj.confirmCallback;
        this.cancelCallback = obj.cancelCallback;
        if (this.saveCallback) {
          this.showSaveBtn = true;
        }
      }
    });
  }
  public closeDialog() {
    this.dialogVisible = false;
  }
  public confirm() {
    this.closeDialog();
    if (this.confirmCallback) {
      this.confirmCallback();
    }
    this.clearCallback();
  }
  public cancel() {
    this.closeDialog();
    if (this.cancelCallback) {
      this.cancelCallback();
    }
    this.clearCallback();
  }
  public save() {
    this.closeDialog();
    if (this.saveCallback) {
      this.saveCallback();
    }
    this.clearCallback();
  }
  public clearCallback() {
    this.confirmCallback = null;
    this.saveCallback = null;
    this.cancelCallback = null;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
$Error-color: #F56C6C;
$Error-hover-color: #FF8484;
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
  &.dialog-error {
    background: $Error-color;
  }
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
.confirm-btn.error {
  background-color: $Error-color;
  border-color: $Error-color;
  &:hover {
    background-color: $Error-hover-color;
    border-color: $Error-hover-color;
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
