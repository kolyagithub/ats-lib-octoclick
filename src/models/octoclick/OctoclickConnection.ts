import {
  NetworkConnection,
  Campaign,
  HttpInstance,
  IHttpConfig,
  IHttpResponse,
  Account, HTML
} from '@atsorganization/ats-lib-ntwk-common';

import { Logger } from '@atsorganization/ats-lib-logger';
import OctoclickAccount from "./OctoclickAccount";
import OctoclickCampaign from "./OctoclickCampaign";
const qs = require('qs'); // Импортируйте библиотеку qs

export default class OctoclickConnection extends NetworkConnection {
  /**
   * Инициализация коллекций
   */
  protected async initCollections(): Promise<void> {
    const externalUrlDictionary = 'dictionary';
    if (this.network.collections && this.api_conn) {
      this.network.collections.countries = await this.api_conn?.get(externalUrlDictionary).then((r: IHttpResponse) => {
        return r.data.data?.country;
      });
    }
  }
  
  /**
   * Авторизация в сети
   * @returns
   */
  private async auth(): Promise<any> {
    
    new Logger({}).setNetwork(this.network.name).setDescription('Получаем авториз. данные из СЕТИ').log();
    const dataAuth: any = {
      email: this.network.login,
      password: this.network.password
    };
    const externalUrl = 'auth/email';
    const url = `${this.network.base_url_api}${externalUrl}`;
    
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: url,
      Origin: this.network.base_url_api
    };
    
    try {
      
      const response = await HttpInstance.request({
        url,
        method: 'POST',
        baseUrl: this.network.base_url_api,
        headers,
        data: qs.stringify(dataAuth),
        maxRedirects: 0,
        validateStatus: (status: any) => status === 200 || status === 302
      } as any);
      
      const accessToken = response?.data.data.token;
      new Logger(accessToken).setNetwork(this.network.name).setDescription('Получены авториз. данные из СЕТИ').log();
      return accessToken;
      
    } catch (err) {
      new Logger(`Response error: ${err}`).setTag('api').log();
    }
    
    
  }

  /**
   * Открытие соединения
   * @returns
   */
  async open(): Promise<NetworkConnection> {
    let authData = await this.getCashe();
    if (!authData) {
      authData = await this.auth();
      await this.setCache(authData);
    }
    // устанока соединения через АПИ
    this.api_conn = new HttpInstance({
      baseUrl: this.network?.base_url_api,
      headers: {
        Authorization: "Bearer " + authData
      }
    });
    this.keepAlive();
    await this.initCollections();
    return this;
  }

  getCampaign(): Campaign {
    return new OctoclickCampaign(this);
  }

  getAccount(): Account {
    return new OctoclickAccount(this);
  }

  /**
   * Поддержание соединения
   */
  keepAlive(): void {
    
    const callbackErrApi = async (response: { config: IHttpConfig; status?: number, data: any }): Promise<any> => {
      if(response.status === 200) {
        return response;
      } else {
        let isRequiredAuth = response.data.errors[0].title.includes("You do not have enough permissions to perform this operation");
        if (response.status === 400 && isRequiredAuth && response.config && !response.config.__isRetryRequest) {
          new Logger(response.data.errors[0].title).setDescription('keepAlive 401').setNetwork(this.network.name).log();
          return await this.auth().then(async (authData: string) => {
            response.config.__isRetryRequest = true;
            response.config.baseUrl = this.network?.base_url_api;
            response.config.headers = {
              Authorization: "Bearer " + authData
            };
            await this.setCache(authData);
            this.api_conn = new HttpInstance({
              baseUrl: this.network?.base_url_api,
              headers: { Authorization: "Bearer " + authData }
            });
            return HttpInstance.request?.(response.config);
          });
          
        } else {
          new Logger(`Response error: ${response.data.errors[0].title}`).setTag('api').log();
        }
      }
      
    };
    const callbackRequestApi = async (config: IHttpConfig) => {
      return config;
    };

    this.api_conn?.keepAlive(callbackRequestApi, callbackErrApi);
    
  }
}
