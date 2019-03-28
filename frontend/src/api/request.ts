import service from './service';

export function postTopoData(data: FormData) {
    return service({
        url: '',
        method: 'post',
        data: data
    })
}
