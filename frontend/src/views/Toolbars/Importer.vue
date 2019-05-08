<template>
  <div class="app-importer-wrap" v-show="!isCheckStatics">
    <img src="../../assets/logo.png" class="app-logo" />
    <div class="app-importer-item app-importer-excel">
      <el-upload action :before-upload="beforeUpload.bind(null, 'target')" :show-file-list="false">
        <el-button size="small" class="upload-btn">{{targetName || $t('lang.importTopoData')}}
          <i class="upload-icon"></i>
        </el-button>
      </el-upload>
      <el-upload class="upload-format" action :before-upload="beforeUpload.bind(null, 'format')" :show-file-list="false">
        <el-button size="small" class="upload-btn">{{formatName || $t('lang.importRCAData')}}
          <i class="upload-icon"></i>
        </el-button>
      </el-upload>
    </div>
    <div class="app-importer-item">
      <el-button size="small" type="primary" class="confirm-btn" :class="{'none-status': !available}" @click="submitData">{{$t('lang.upload')}}</el-button>
    </div>
    <div class="app-export-item">
      <el-button size="small" plain class="export-btn" @click="exportData">{{$t('lang.export')}}</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Provide } from "vue-property-decorator";
import { State } from 'vuex-class';
import { postTopoData, getInterval, exportAlarmData } from '@/api/request';
import bus from '@/util/bus';
import { EventType, StaticsRes } from '@/types/type';
import NProgress from 'nprogress';
import { downLoad } from '@/util/util';

NProgress.configure({
  easing: 'ease',  // 动画方式
  speed: 500,  // 递增进度条的速度
  showSpinner: false, // 是否显示加载ico
  trickleSpeed: 200, // 自动递增间隔
  minimum: 0.3 // 初始化时的最小百分比
})

@Component
export default class Importer extends Vue {
  @Provide() private targetName: string = '';
  @Provide() private formatName: string = '';
  @Provide() private targetFile: any;
  @Provide() private formatFile: any;
  @Provide() private available: boolean = false;
  @State((state) => state.app.isCheckStatics) private isCheckStatics!: boolean;
  @State((state) => state.app.clientId) private clientId!: string;
  @State((state) => state.app.isNonImported) private isNonImported!: boolean;
  @State((state) => state.app.isCheckNone) private isCheckNone!: boolean;

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
      bus.$emit(EventType.ERRORVISIBLE, '<p>导入文件仅支持：CSV、XLSX、XLS</p>');
      return;
    }
    if (this.targetFile && this.formatFile) {
      this.available = true;
    }
    return false;
  }
  public autoUpload() {
    // 禁止再次点击
    this.available = false;
    const form: FormData = new FormData();
    form.append('file1', this.targetFile);
    form.append('file2', this.formatFile);
    NProgress.start();
    if (!this.isNonImported) {
      this.clearAllData();
    }
    postTopoData(form).then((res: StaticsRes) => {
      this.$store.commit('SET_CLIENTID', res.client_id);
      this.setDefaultDate();
      this.$store.commit('SET_STATICS', res);
      this.$store.commit('SET_ISNOEIMPORTED', false);
      NProgress.done();
    }).catch((e) => {
      bus.$emit(EventType.ERRORVISIBLE, {
        title: '错误提示',
        type: 'error',
        content: `<p>${e.message}</p>`
      });
      NProgress.done();
    })
  }
  public setDefaultDate() {
    getInterval({xAlarm: this.isCheckNone}).then((res: {start: number, end: number}) => {
      const dateValue = [res.start * 1000 - 8 * 3600 * 1000, res.end * 1000 - 8 * 3600 * 1000];
      this.$store.commit('SET_DEFAULTDATE', dateValue);
    });
  }
  public submitData() {
    if (this.available) {
      if (this.isCheckStatics) {
        this.$store.commit('SET_ISCHECKSTATICS', false);
      }
      this.autoUpload();
    }
  }
  public clearAllData() {
    this.$store.commit('SET_CLIENTID', '');
    this.$store.commit('SET_DEFAULTDATE', []);
    this.$store.commit("SET_REGVALUE", '');
    this.$store.commit("SET_REGTYPE", '');
    this.$store.commit('SET_GROUPID', '');
    this.$store.commit('SET_GROUPIDS', []);
    this.$store.commit('SET_ALARMDATAS', []);
    this.$store.commit('SET_TOPODATA', '');
    bus.$emit(EventType.CLEAREXPAN);
  }
  public goBack() {
    this.$store.commit('SET_ISCHECKSTATICS', false);
  }
  public exportData() {
    if (!this.clientId) {
      bus.$emit(EventType.ERRORVISIBLE, '<p>请上传文件后再导出数据</p>');
      return;
    }
    downLoad(`download?clientId=${this.clientId}&t=${Date.now()}`);
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
      width: 200px;
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
  .app-export-item {
    position: absolute;
    right: 20px;
    line-height: 30px;
    .export-btn {
      color: #338aff;
      border: solid 1px #338aff;
      font-size: 14px;
      padding: 8px 10px;
    }
  }
}
</style>
