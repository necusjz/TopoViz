import axios, { AxiosInstance } from 'axios';
import app from '@/store/app';
import { baseUrl } from '@/util/config';

const service: AxiosInstance = axios.create({
  baseURL: baseUrl,
  timeout: 150000,
});

service.interceptors.request.use((config: any) => {
  // 添加cookie验证信息
  const clientId = app.state.clientId;
  if (clientId) {
    config.headers['Client-Id'] = clientId;
  }
  return config;
}, (error: Error) => {
  Promise.reject(error);
});

// respone拦截器
service.interceptors.response.use(
  (response: any) => {
    const res = response.data;
    return res;
  },
  (error: Error) => {
    return Promise.reject(error);
  },
);

function request(options: {url: string, method: string, [k: string]: any}): Promise<any> {
  return new Promise((resolve, reject) => {
    service(options).then((res: any) => {
      resolve(res);
    }).catch((error: Error) => {
      reject(error);
    });
  });
}

export default request;
