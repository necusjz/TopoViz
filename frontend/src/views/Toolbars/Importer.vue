<template>
  <div class="app-importer-wrap">
    <div class="app-importer-item app-importer-excel">
      <el-upload action :before-upload="beforeUpload.bind(null, 'target')" :show-file-list="false">
        <el-button size="small" class="upload-btn">{{targetName || '导入Topo数据'}}
          <i class="upload-icon"></i>
        </el-button>
      </el-upload>
      <el-upload class="upload-format" action :before-upload="beforeUpload.bind(null, 'format')" :show-file-list="false">
        <el-button size="small" class="upload-btn">{{formatName || '导入历史告警数据'}}
          <i class="upload-icon"></i>
        </el-button>
      </el-upload>
    </div>
    <div class="app-importer-item app-importor-date">
      <el-date-picker
        v-model="dateValue"
        type="datetimerange"
        class="app-importer-date"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :default-time="['12:00:00']"
        size="small"
      ></el-date-picker>
    </div>
    <div class="app-importer-item">
      <el-button size="small" type="primary" class="confirm-btn" :class="{'none-status': !targetName && !formatName}">确定</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Provide } from "vue-property-decorator";

@Component
export default class Importer extends Vue {
  @Provide() private dateValue: any = [];
  @Provide() private targetName: string = '';
  @Provide() private formatName: string = '';
  @Provide() private targetFile: any;
  @Provide() private formatFile: any;
  public beforeUpload(type: string, file: File) {
    if (type === 'target') {
      this.targetFile = file;
      this.targetName = this.targetFile.name;
    } else {
      this.formatFile = file;
      this.formatName = this.formatFile.name;
    }
    return false;
  }
}
</script>
<style lang="scss">
$Btn_Background: linear-gradient(0deg, #f2f2f2 1%, #f7faff 100%);
.app-importer-wrap {
  position: relative;
  height: 50px;
  padding: 0 20px;
  background: #ffffff;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  .app-importer-item {
    line-height: 30px;
    &:not(:last-child) {
      padding-right: 40px;
    }
  }
  .app-importer-excel {
    display: inline-flex;
    justify-content: space-around;
    padding-left: 80px;
    .upload-format {
      margin-left: 20px;
    }
    .upload-btn {
      position: relative;
      background-image: $Btn_Background;
      border: 1px solid #bdc8d1;
      border-radius: 4px;
      color: #778296;
      padding: 8px 12px;
      width: 180px;
      text-align: left;
      font-size: 14px;
    }
    .upload-icon {
      display: inline-block;
      position: absolute;
      right: 8px;
      width: 16px;
      height: 16px;
      background-image: url('../../assets/upload-icon.png');
      background-size: contain;
      transform: translateY(-20%);
    }
  }
  .app-importor-date {
    cursor: pointer;
    .app-importer-date {
      height: 30px;
      background-image: $Btn_Background;
      color: #778296;
      .el-range-input {
        background-image: $Btn_Background;
      }
    }
  }
}
</style>

