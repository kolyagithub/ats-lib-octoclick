import {
  NetworkConnection,
  Campaign,
  HttpInstance,
  IHttpConfig,
  IHttpResponse,
  Account, HTML
} from '@atsorganization/ats-lib-ntwk-common';

import { Logger } from '@atsorganization/ats-lib-logger';
import { IResultFullDataCampaignCountryItem } from './Octoclick';
import OctoclickAccount from "./OctoclickAccount";
const qs = require('qs'); // Импортируйте библиотеку qs

export default class OctoclickConnection extends NetworkConnection {
  /**
   * Инициализация коллекций
   */
  protected async initCollections(): Promise<void> {
    const externalUrlGetALlCountries = 'https://restcountries.com/v3.1/all';
    const externalUrlCountries = 'dictionary';
    if (this.network.collections && this.api_conn) {
      const allCountries = await HttpInstance.request({
        url: externalUrlGetALlCountries,
        method: 'GET'
      }).then((d: IHttpResponse) => d.data);
      this.network.collections.countries = await this.api_conn?.get(externalUrlCountries).then((r: IHttpResponse) => {
        return r.data.data?.country.map((m: IResultFullDataCampaignCountryItem) => {
          return {
            ...m,
            code: allCountries.find((f: any) => f.name.common.toLowerCase() === m.label.toLowerCase())?.cca2
          };
        });
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
    const response: IHttpResponse = await HttpInstance.request({
      url,
      method: 'POST',
      baseUrl: this.network.base_url_api,
      headers,
      data: qs.stringify(dataAuth),
      maxRedirects: 0,
      validateStatus: (status: any) => status === 200 || status === 302
    } as any);
    const accessToken = response.data.data.token;
    new Logger(accessToken).setNetwork(this.network.name).setDescription('Получены авториз. данные из СЕТИ').log();
    return { accessToken };
    
  }

  /**
   * Открытие соединения
   * @returns
   */
  async open(): Promise<NetworkConnection> {
    let authData = await this.getCashe();
    authData = JSON.parse(authData);
    if (!authData) {
      authData = await this.auth();
      await this.setCache(JSON.stringify(authData));
    }
    // устанока соединения через АПИ
    this.api_conn = new HttpInstance({
      baseUrl: this.network?.base_url_api,
      headers: {
        Authorization: "Bearer " + authData.accessToken
      }
    });
    this.keepAlive();
    await this.initCollections();
    return this;
  }

  getCampaign(): Campaign {
    throw new Error('Method not implemented.');
  }

  getAccount(): Account {
    return new OctoclickAccount(this);
  }

  /**
   * Поддержание соединения
   */
  keepAlive(): void {
    
    const callbackErrApi = async (response: { config: IHttpConfig; status?: number }): Promise<any> => {
      if (response.status === 401 && response.config && !response.config.__isRetryRequest) {
        new Logger({}).setDescription('keepAlive 401').setNetwork(this.network.name).log();
        return await this.auth().then(async (authData: any) => {
          response.config.__isRetryRequest = true;
          response.config.baseUrl = this.network?.base_url_api;
          response.config.headers = {
            Authorization: "Bearer " + authData.accessToken
          };
          await this.setCache(JSON.stringify(authData));
          this.api_conn = new HttpInstance({
            baseUrl: this.network?.base_url_api,
            headers: { Authorization: "Bearer " + authData.accessToken }
          });
          return HttpInstance.request?.(response.config);
        });
      }
      return response;
    };
    const callbackRequestApi = async (config: IHttpConfig) => {
      return config;
    };

    this.api_conn?.keepAlive(callbackRequestApi, callbackErrApi);
    
  }
}
