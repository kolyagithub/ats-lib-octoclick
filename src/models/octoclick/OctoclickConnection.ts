`import {
  NetworkConnection,
  Campaign,
  HttpInstance,
  IHttpConfig,
  IHttpResponse,
  Account
} from '@atsorganization/ats-lib-ntwk-common';

import { Logger } from '@atsorganization/ats-lib-logger';
import { IResultFullDataCampaignCountryItem } from './Octoclick';
const qs = require('qs'); // Импортируйте библиотеку qs

export default class OctoclickConnection extends NetworkConnection {
  /**
   * Инициализация коллекций
   */
  protected async initCollections(): Promise<void> {
    const externalUrlGetALlCountries = 'https://restcountries.com/v3.1/all';
    const externalUrlCountries = 'api/autocomplete/searchcountries/search/';
    if (this.network.collections && this.admin_conn) {
      const allCountries = await HttpInstance.request({
        url: externalUrlGetALlCountries,
        method: 'GET'
      }).then((d: IHttpResponse) => d.data);

      this.network.collections.countries = await this.admin_conn?.get(externalUrlCountries).then((r: IHttpResponse) => {
        return r.data.data.map((m: IResultFullDataCampaignCountryItem) => {
          return {
            ...m,
            code: allCountries.find((f: any) => f.name.common.toLowerCase() === m.titleEn.toLowerCase())?.cca2
          };
        });
      });
    }
  }

  /**
   * Авторизация в сети
   * @returns
   */
  private async auth(): Promise<string> {
    new Logger({}).setNetwork(this.network.name).setDescription('Получаем авториз. данные из СЕТИ').log();
    const dataAuth: any = {
      username: this.network.login,
      password: this.network.password
    };
    const externalUrl = 'auth/email';
    const url = `${this.network.base_url_admin}${externalUrl}`;
    
    const headers = {
      'Content-Type': 'application/json',
      Referer: 'https://panel.octoclick.com/',
      Origin: 'https://panel.octoclick.com'
    };
    const response: any = await HttpInstance.request({
      url,
      method: 'POST',
      baseUrl: this.network.base_url_admin,
      headers,
      data: qs.stringify(dataAuth),
      maxRedirects: 0,
      validateStatus: (status: any) => status === 200 || status === 302
    } as any);
    
    console.log(response);
    
    new Logger(response.data).setNetwork(this.network.name).setDescription('Получены авториз. данные из СЕТИ').log();
    return response.data;
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
      headers: {}
    });
    this.admin_conn = new HttpInstance({
      baseUrl: this.network?.base_url_admin,
      headers: { Cookie: authData }
    });
    this.keepAlive();
    await this.initCollections();
    return this;
  }

  // getCampaign(): Campaign {
  //   return new ExoclickCampaign(this);
  // }
  //
  // getAccount(): Account {
  //   return new ExcoclickAccount(this);
  // }

  /**
   * Поддержание соежинения в живых
   */
  keepAlive(): void {
  
  }
}
