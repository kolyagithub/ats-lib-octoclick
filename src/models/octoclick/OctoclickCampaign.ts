import { RESPONSE_CODES } from '../../consts';
import FullDataCampaign from './api/FullDataCampaign';

import {
  ScheduleCampaign,
  ResponceApiNetwork,
  IHttpResponse,
  IdCampaign,
  StatusCampaign,
  PlacementCampaign,
  ICampaign,
  Campaign,
  BidCampaign,
  StatsRaw, NameCampaign
} from "@atsorganization/ats-lib-ntwk-common";

import ResponseAddCreative from './api/ResponseAddCreative';
import AddDataCampaign from './api/AddDataCampaign';
import UpdateDataCampaign from './api/UpdateDataCreative';

import AddDataCreative from './api/AddDataCreative';
import ResponseAddCampaign from './api/ResponseAddCampaign';
import { IResultFullDataCampaignCountryItem } from "./Octoclick";

export default class OctoclickCampaign extends Campaign {
  
  /**
   * Создание кампании
   * @param data
   * @returns
   */
  async create(data: ICampaign): Promise<ResponceApiNetwork<Campaign>> {
    const { name, template_id, bid, country, placements_data, target_url, schedule } = data;
    
    const fullDataCampaign: FullDataCampaign | null = await this.getFullDataCampaign(new IdCampaign(template_id.value));
    if (!fullDataCampaign) {
      return new ResponceApiNetwork({
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        message: 'Not get data from network'
      });
    }
    
    if (!target_url.value) {
      return new ResponceApiNetwork({
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        message: 'Not get data from network'
      });
    }
    
    const NeedCountry: IResultFullDataCampaignCountryItem = this.conn.network.collections?.countries?.find(
        (f: any) => String(f.country_code) === String(country.value)
    );
    
    const addDataCampaign = AddDataCampaign.fromFullDataCampaign(fullDataCampaign)
    .setName(String(name.value))
    .setCountry(NeedCountry)
    
    const responseCreateCampaign: ResponseAddCampaign | null = await this.addRaw(addDataCampaign);
    
    if (responseCreateCampaign?.value.meta.code !== 200) {
      return new ResponceApiNetwork({
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        message: JSON.stringify(responseCreateCampaign) + ' add campaigns'
      });
    }
    const newCampId = responseCreateCampaign?.value.data.bcid;
    
    const newCreative = await this.createCreative(
        newCampId,
        AddDataCreative.fromFullDataCampaign(fullDataCampaign)
        .setName(String(name.value))
        .setBid(Number(bid.value) / 1000)
        .setTargetUrl(target_url.value)
    );
    if (newCreative?.value.meta.code === 200) {
      this.setId(new IdCampaign(newCampId))
      .setName(name)
      .setTemplateId(template_id)
      .setBid(bid)
      .setCountry(country)
      .setPlacementsData(placements_data)
      .setTargetUrl(target_url)
      .setStatus(new StatusCampaign('moderation'));
      
      return new ResponceApiNetwork({ code: RESPONSE_CODES.SUCCESS, message: 'OK', data: this });
    } else {
      // await this.removeUnit(new IdCampaign(newCampId));
      return new ResponceApiNetwork({
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        message: JSON.stringify(newCreative) + ' add creative'
      });
    }
  }
  
  /**
   * Обновление кампании
   * доступны следующие свойства
   * name
   * adv_category_id  Dictionary(campaign.category)
   *
   * country
   * bid
   * target_гкд - меняет статус на модерацию !!!
   * schedule
   * placements_data
   * browser_version
   */
  async update(): Promise<ResponceApiNetwork<Campaign>> {
    throw Error('Method not implemented');
  }
  
  /**
   * Установка расписания кампании
   * по умолчанию полное расписание
   * @param schedule
   */
  async updateSchedule(schedule: ScheduleCampaign = new ScheduleCampaign()): Promise<ResponceApiNetwork<Campaign>> {
    throw Error('Method not implemented');
  }
  
  /**
   * Вытянуть все данные по кампании из сети
   */
  async fetch(): Promise<ResponceApiNetwork<Campaign>> {
    this.handlerErrNotIdCampaign();
    const fullDataResponse: FullDataCampaign | null = await this.getFullDataCampaign(this.id);
    if (!fullDataResponse) {
      return new ResponceApiNetwork({
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        message: 'Not get data from network'
      });
    }
    
    const { campaign: { bcid, name } } = fullDataResponse.value;
    
    this.setId(new IdCampaign(bcid))
    .setName(new NameCampaign(name));
    
    return new ResponceApiNetwork({ code: RESPONSE_CODES.SUCCESS, message: 'OK', data: this });
  }

  /**
   * Создание креатива
   * @param campaignId
   * @param data
   * @returns
   */
  private async createCreative(campaignId: string, data: AddDataCreative): Promise<ResponseAddCreative | null> {
    const externalUrl = `campaign/${campaignId}/creative`;
    let createdCreative = null;
    if (this.conn.api_conn) {
      createdCreative = await this.conn.api_conn
        ?.post(`${externalUrl}`, data.value, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then((d: IHttpResponse) => new ResponseAddCreative(d.data));
    }
    return createdCreative;
  }

  /**
   * Обновление кампании
   * @param data
   * @returns
   */
  protected async updateRaw(data: UpdateDataCampaign): Promise<ResponseAddCreative | null> {
    throw new Error('Method not implemented.');
  }

  /**
   * Создание кампании
   * @param data
   * @returns
   */
  protected async addRaw(data: AddDataCampaign): Promise<ResponseAddCampaign | null> {
    const externalUrl = `campaign`;

    let responseData: ResponseAddCampaign | null = null;
    if (this.conn.api_conn) {
      responseData = await this.conn.api_conn
        .post(`${externalUrl}`, data.value, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then((d: IHttpResponse) => {
          return new ResponseAddCampaign(d.data)
        });
    }
    return responseData;
  }

  /**
   * Получение полной информации по кампании из сети
   * @param campaignId
   * @returns
   */
  private async getFullDataCampaign(campaignId: IdCampaign): Promise<FullDataCampaign | null> {
    const idCampaignValue = campaignId.value;
    const externalUrl = `campaign/${idCampaignValue}`;
    let data: FullDataCampaign | null = null;
    if (this.conn.api_conn) {
      data = await this.conn.api_conn.get(externalUrl).then(async (resp: IHttpResponse) => {
        const campaign = resp.data?.data;
        const externalURLGetCampaignCreatives = `campaign/creative?filter[campaign.bcid:%3D]=${campaign.bcid}`;
        
        const creative = await this.conn.api_conn
          ?.get(externalURLGetCampaignCreatives)
          .then(async (respCreative: IHttpResponse) => {
            return respCreative.data?.data[0]; // Get only first creative
          });
        
        return new FullDataCampaign({ campaign, creative });
      });
    }
    return data;
  }

  /**
   * Получение статуса кампании
   * @param id
   * @returns
   */
  async getStatus(): Promise<ResponceApiNetwork<StatusCampaign>> {
    throw new Error('Method not implemented.');
  }

  /**
   * Обновление площадок в кампании
   * @param data
   * @returns
   */
  async updatePlacements(data: PlacementCampaign): Promise<ResponceApiNetwork<Campaign>> {
    throw new Error('Method not implemented.');
  }

  /**
   * Удаление кампании
   */
  async remove(): Promise<ResponceApiNetwork> {
    throw new Error('Method not implemented.');
  }

  /**
   * Запуск кампании
   */
  async start(): Promise<ResponceApiNetwork> {
    throw new Error('Method not implemented.');
  }

  /**
   * Остановка кампании
   */
  async stop(): Promise<ResponceApiNetwork> {
    throw new Error('Method not implemented.');
  }

  /**
   * Мин ставка
   * @returns
   */
  async minBid(): Promise<ResponceApiNetwork<BidCampaign>> {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Статистика
   * @param date
   */
  async stats(date: string): Promise<ResponceApiNetwork<StatsRaw>> {
    throw new Error('Method not implemented.');
  }
  
}
