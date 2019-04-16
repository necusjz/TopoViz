<script lang="ts">
import { Component, Vue, Provide, Watch } from "vue-property-decorator";
import { generateUUID, generateDateByTimestamp } from '@/util/util';
import { AlarmData, Rules, AnalyzeRes, SelectOption, RCAResult} from '@/types/type';

@Component
export default class CommonMixin extends Vue {
  formatData(item: any): AlarmData {
    return {
      uid: generateUUID(),
      index: item['Index'],
      alarmName: item['AlarmName'],
      alarmSourceName: item['AlarmSource'],
      company: item['Vendor'],
      firstTime: generateDateByTimestamp(item['First']),
      lastTime: item['Last'],
      level: item['Level'],
      clearTime: item['Clear'],
      domain: item['Domain'],
      groupId: item['GroupId'],
      groupId_edit: item['GroupId_Edited'],
      rcaResult: item['RcaResult'].toString(),
      rcaResult_edit: item['RcaResult_Edited'],
      rcaReg: item['RuleName'],
      rcaReg_edit: item['RuleName_Edited'],
      isConfirmed: !!item['Confirmed']
    };
  }
}
</script>