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
import RuCaptcha from '../../services/RuCaptcha';
import { RU_CAPTCHA_KEY } from '../../consts';
import ModelSiteIdCaptcha from "./api/ModelSiteIdCaptcha";
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
  
  private solveReCapathca = async (site_id: any, site_url: any): Promise<any> => {
    const ruCaptcha = new RuCaptcha(RU_CAPTCHA_KEY);
    const id_res_solve_recaptcha = await ruCaptcha.sendReCaptcha(site_id, site_url);
    const result_captcha = await ruCaptcha.result(id_res_solve_recaptcha);
    console.log('result_captcha', id_res_solve_recaptcha, result_captcha);
    return result_captcha;
  };
  
  private mutationAttrSiteKey(data: string): string {
    return data.replace('data-sitekey', 'datasitekey');
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
    
    let modelSiteIdCaptcha: ModelSiteIdCaptcha = {
      isCaptcha: '.cf-turnstile (datasitekey)'
    };
    const loginPage = await HttpInstance.request({
      url,
      method: 'GET',
      baseUrl: this.network.base_url_admin
    }).then((d: any) => d);
    // In API doc write static site-key 0x4AAAAAAAGTd1uFW5wSEBqK.
    // Use there or find site-key by parse?
    const isCaptcha = HTML.parse(this.mutationAttrSiteKey(loginPage.data), modelSiteIdCaptcha)?.['isCaptcha'];
    console.log('isCaptcha', isCaptcha);
    if (isCaptcha) {
      const turnstile_response_recaptcha = await this.solveReCapathca(isCaptcha, this.network.base_url_admin + externalUrl);
      console.log('turnstile_response_recaptcha', turnstile_response_recaptcha);
      dataAuth['cf-turnstile-response'] = turnstile_response_recaptcha;
    }
    
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
    
    new Logger(response.status).setNetwork(this.network.name).setDescription('Получены авториз. данные из СЕТИ').log();
    return response.status;
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
   * Поддержание соединения
   */
  keepAlive(): void {
    // admin conn
    const callbackErrAdmin = async (response: { config: IHttpConfig; status?: number }): Promise<any> => {
      if (response.status === 401 && response.config && !response.config.__isRetryRequest) {
        new Logger({}).setDescription('keepAlive 401').setNetwork(this.network.name).log();
        return await this.auth().then(async (authData: string) => {
          response.config.__isRetryRequest = true;
          response.config.baseUrl = this.network?.base_url_admin;
          response.config.headers = {
            Cookie: authData
          };
          console.log(response.config);
          await this.setCache(authData);
          this.admin_conn = new HttpInstance({
            baseUrl: this.network?.base_url_admin,
            headers: { Cookie: authData }
          });
          return HttpInstance.request?.(response.config);
        });
      }
      return response;
    };

    // api conn
    const callbackErrApi = async (response: { config: IHttpConfig; status?: number }): Promise<any> => {
      return response;
    };
    const callbackRequestAdmin = async (config: IHttpConfig) => {
      return config;
    };

    this.api_conn?.keepAlive(async () => {}, callbackErrApi);
    this.admin_conn?.keepAlive(callbackRequestAdmin, callbackErrAdmin);
  }
}
