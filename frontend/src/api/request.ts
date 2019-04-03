import service from './service';

export function postTopoData(data: FormData) {
    return service({
        url: 'upload',
        method: 'post',
        data: data
    })
}

export function getAlarmDatas(params: {groupId?: string, addCondition?: number, addValue?: string}) {
    return service({
        url: 'analyze',
        method: 'get',
        params
    })
}

