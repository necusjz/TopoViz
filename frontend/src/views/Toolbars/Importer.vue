<template>
  <div class="app-importer-wrap">
     <img src="../../assets/logo.png" class="app-logo" v-show="!isCheckStatics">
    <div class="app-importer-item app-back-wrap" v-if="isCheckStatics" @click="goBack">
      <i class="el-icon-back"></i>
      <span class="app-back">返回</span>
    </div>
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
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        :default-time="['12:00:00']"
        value-format="timestamp"
        :clearable="false"
        @change="dateChange"
        size="small"
      ></el-date-picker>
    </div>
    <div class="app-importer-item">
      <el-button size="small" type="primary" class="confirm-btn" :class="{'none-status': unavailable}" @click="submitData">确定</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Provide } from "vue-property-decorator";
import { State } from 'vuex-class';
import { postTopoData, getStaticsDataByInterval} from '@/api/request';
import bus from '@/util/bus';
import { VisibleType, StaticsRes } from '@/types/type';

@Component
export default class Importer extends Vue {
  @Provide() private dateValue: number[] = [];
  @Provide() private targetName: string = '';
  @Provide() private formatName: string = '';
  @Provide() private targetFile: any;
  @Provide() private formatFile: any;
  @Provide() private unavailable: boolean = true;
  @State((state) => state.app.isCheckStatics) private isCheckStatics!: boolean;
  public beforeUpload(type: string, file: File) {
    if (file.name.endsWith('csv') || file.name.endsWith('xlsx') || file.name.endsWith('xls')) {
      if (type === 'target') {
        this.targetFile = file;
        this.targetName = this.targetFile.name;
      } else {
        this.formatFile = file;
        this.formatName = this.formatFile.name;
      }
    } else {
      bus.$emit(VisibleType.ERRORVISIBLE, '<p>文件类型仅支持csv, xlsx, xls</p>');
      return;
    }
    if (this.targetFile && this.formatFile) {
      this.autoUpload();
    }
    return false;
  }
  public autoUpload() {
    const form: FormData = new FormData();
    form.append('file1', this.targetFile);
    form.append('file2', this.formatFile);
    postTopoData(form).then((res: any) => {
      localStorage.setItem('client-id', res.client_id);
      this.dateValue = [res.start * 1000 - 8 * 3600 * 1000, res.end * 1000 - 8 * 3600 * 1000];
      this.unavailable = false;
    });
  }
  public dateChange(value: number[]) {
    this.unavailable = !value || !this.targetFile || !this.formatFile;
  }
  public submitData() {
    if (this.isCheckStatics) {
      this.$store.commit('SET_ISCHECKSTATICS', false);
    }
    let date: number[] = [];
    if (this.dateValue && this.dateValue.length > 0) {
      date = this.dateValue.map((d: number) => d / 1000);
    }
    const start = date[0].toString();
    const end  = date[1].toString();
    getStaticsDataByInterval({start, end}).then((res: StaticsRes) => {
      this.$store.commit('SET_STATICS', res);
      this.$store.commit('SET_ISNOEIMPORTED', false);
    });
  }
  public goBack() {
    this.$store.commit('SET_ISCHECKSTATICS', false);
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
  .app-back-wrap:nth-of-type(1) {
    padding-right: 0;
    cursor: pointer;
    .app-back {
      padding-left: 10px;
    }
  }
  .app-logo {
    width: 70px;
    height: 70px;
    transform: translateY(-30%);
    box-shadow: 0 4px 8px 0 #30a1fa;
    border-radius: 50%;
  }
  .app-importer-excel {
    display: inline-flex;
    justify-content: space-around;
    padding-left: 20px;
    .upload-format {
      margin-left: 20px;
    }
    .upload-btn {
      width: 180px;
      position: relative;
      background-image: $Btn_Background;
      border: 1px solid #bdc8d1;
      border-radius: 4px;
      color: #778296;
      padding: 8px 12px;
      text-align: left;
      font-size: 14px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
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
      width: 360px;
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

