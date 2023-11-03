import { RESPONSE_CODES } from '../../consts';
import FullDataCampaign from "./api/FullDataCampaign";
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
  StatsRaw, NameCampaign, TargetUrlCampaign, CountryCampaign
} from "@atsorganization/ats-lib-ntwk-common";
import ResponseCreative from './api/ResponseCreative';
import DataCampaign from './api/DataCampaign';
import DataCreative from './api/DataCreative';
import ResponseCampaign from './api/ResponseCampaign';
import { IResultFullDataCampaignCountryItem } from "./Octoclick";
import { CampaignStatus, CreativeStatus, PlacementType } from "./api/Enums";
import { status } from "@atsorganization/ats-lib-ntwk-common/lib/models/StatusCampaign";
import { Logger } from "@atsorganization/ats-lib-logger";
import ResponseMinBid, { IResultMinBidConditionsGroup } from "./api/ResponseMinBid";

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
    
    const addDataCampaign = DataCampaign.fromFullDataCampaign(fullDataCampaign)
    .setName(String(name.value))
    .setCountry(NeedCountry)
    .setPlacements(placements_data.value);
    
    const responseCreateCampaign: ResponseCampaign | null = await this.addRaw(addDataCampaign);
    
    if (responseCreateCampaign?.value.meta.code !== 200) {
      return new ResponceApiNetwork({
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        message: JSON.stringify(responseCreateCampaign) + ' add campaigns'
      });
    }
    const newCampId = responseCreateCampaign?.value.data.bcid;
    
    const newCreative = await this.createCreative(
        newCampId,
        DataCreative.fromFullDataCampaign(fullDataCampaign)
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
      await this.removeUnit(new IdCampaign(newCampId));
      return new ResponceApiNetwork({
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        message: JSON.stringify(newCreative) + ' add creative'
      });
    }
  }
  
  /**
   * Обновление кампании
   */
  async update(): Promise<ResponceApiNetwork<Campaign>> {
    
    const { name, template_id, bid, country, placements_data, target_url, schedule } = this;
    const fullDataCampaign: FullDataCampaign | null = await this.getFullDataCampaign(this.id);
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
    
    const { value: { creative: { bcid: updatedCreativeId}}} =  fullDataCampaign;
    
    const dataCampaign = DataCampaign.fromFullDataCampaign(fullDataCampaign);
    if(name) {
      dataCampaign.setName(String(name.value));
    }
    if(country) {
      const NeedCountry: IResultFullDataCampaignCountryItem = this.conn.network.collections?.countries?.find(
          (f: any) => String(f.country_code) === String(country.value)
      );
      dataCampaign.setCountry(NeedCountry);
    }
    if(placements_data) {
      dataCampaign.setPlacements(placements_data.value);
    }
    
    const responseUpdateCampaign: ResponseCampaign | null = await this.updateRaw(dataCampaign);
    if (responseUpdateCampaign?.value.meta.code !== 200) {
      return new ResponceApiNetwork({
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        message: JSON.stringify(responseUpdateCampaign) + ' update campaigns'
      });
    }
    const updatedCampId = responseUpdateCampaign?.value.data.bcid;

    const dataCreative = DataCreative.fromFullDataCampaign(fullDataCampaign);
    if(bid) {
      dataCreative.setBid(Number(bid.value) / 1000);
    }
    if(target_url) {
      dataCreative.setTargetUrl(target_url.value);
    }
    const responseUpdatedCreative = await this.updateCreative(
        updatedCampId,
        updatedCreativeId,
        dataCreative
    );
    if (responseUpdatedCreative?.value?.meta.code !== 200) {
      new Logger("Creative not updated").setTag('').log();
    }
    
    this.setId(new IdCampaign(updatedCampId))
    .setName(name)
    .setTemplateId(template_id)
    .setBid(bid)
    .setCountry(country)
    .setPlacementsData(placements_data)
    .setTargetUrl(target_url)
    .setStatus(new StatusCampaign('moderation'));
    
    return new ResponceApiNetwork({ code: RESPONSE_CODES.SUCCESS, message: 'OK', data: this });
    
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
    
    const {
      campaign: { bcid, name, targeting },
      creative: { target_url, bid_to }
    } = fullDataResponse.value;
    
    this.setId(new IdCampaign(bcid))
    .setName(new NameCampaign(name))
    .setTargetUrl(new TargetUrlCampaign(target_url))
    .setCountry(
        new CountryCampaign(
          this.conn.network.collections?.countries?.find(
            (f: any) => String(f.value) === String(targeting.countries[0])
        ))
    )
    .setBid(new BidCampaign(Number(bid_to)))
    .setPlacementsData(
        new PlacementCampaign({
          list: [targeting.ip_list[0].range] ?? [],
          type: targeting.ip_list[0].filter_type === PlacementType.BLACK_LIST ?? false
        })
    )
    .setStatus(this.prepareStatus(fullDataResponse))
    // .setSchedule(this.transformSchedule(timeData));
    return new ResponceApiNetwork({ code: RESPONSE_CODES.SUCCESS, message: 'OK', data: this });
  }
  
  /**
   * Подготовка корректного статуса для API
   * @param data
   * @returns
   */
  private prepareStatus(data: FullDataCampaign): StatusCampaign {
    const {
      campaign: { status: statusCampaign },
      creative: { status: statusCreative }
    } = data.value;
    
    let resultStatus: status = 'rejected';
    
    // Если у креатива статус модерация то используем его статус для определения статуса кампании
    const isCreativeModerateStatus = statusCreative === CreativeStatus.MODERATION;
    
    if(isCreativeModerateStatus) {
      resultStatus = 'moderation';
    } else {
      switch (statusCampaign) {
        case CampaignStatus.ACTIVE:
          resultStatus = 'working';
          break;
        case CampaignStatus.PAUSED:
          resultStatus = 'stopped';
          break;
      }
    }
    
    return new StatusCampaign(resultStatus);
    
  }
  
  /**
   * Создание креатива
   * @param campaignId
   * @param data
   * @returns
   */
  private async createCreative(campaignId: string, data: DataCreative): Promise<ResponseCreative | null> {
    const externalUrl = `campaign/${campaignId}/creative`;
    let createdCreative = null;
    if (this.conn.api_conn) {
      createdCreative = await this.conn.api_conn
        ?.post(`${externalUrl}`, data.value, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then((d: IHttpResponse) => new ResponseCreative(d.data));
    }
    return createdCreative;
  }
  
  /**
   * Обновление креатива
   * @param campaignId
   * @param creativeId
   * @param data
   * @returns
   */
  private async updateCreative(campaignId: string, creativeId: string, data: DataCreative): Promise<ResponseCreative | null> {
    const externalUrl = `campaign/${campaignId}/creative/${creativeId}`;
    let creative = null;
    if (this.conn.api_conn) {
      creative = await this.conn.api_conn
      ?.patch(`${externalUrl}`, data.value, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then((d: IHttpResponse) => {
        return new ResponseCreative(d.data)
      });
    }
    return creative;
  }
  
  /**
   * Создание кампании
   * @param data
   * @returns
   */
  protected async addRaw(data: DataCampaign): Promise<ResponseCampaign | null> {
    const externalUrl = `campaign`;

    let responseData: ResponseCampaign | null = null;
    if (this.conn.api_conn) {
      responseData = await this.conn.api_conn
        .post(`${externalUrl}`, data.value, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then((d: IHttpResponse) => {
          return new ResponseCampaign(d.data)
        });
    }
    return responseData;
  }
  
  /**
   * Обновление кампании
   * @param data
   * @returns
   */
  protected async updateRaw(data: DataCampaign): Promise<ResponseCampaign | null> {
    const externalUrl = `campaign/${data.value.bcid}`;
    
    let responseData: ResponseCampaign | null = null;
    if (this.conn.api_conn) {
      responseData = await this.conn.api_conn
      .patch(`${externalUrl}`, data.value, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then((d: IHttpResponse) => {
        return new ResponseCampaign(d.data)
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
    this.handlerErrNotIdCampaign();
    return await this.removeUnit(this.id);
  }
  
  private async changeCampaignStatus(id: IdCampaign, campaignStatus: CampaignStatus): Promise<ResponceApiNetwork> {
    const externalURL = `campaign/${id.value}/change-status/${campaignStatus}`;
    let resultSwitchStatusUnit = null;
    if (this.conn.api_conn) {
      const headers = {
        'Content-Type': 'application/json'
      };
      resultSwitchStatusUnit = await this.conn.api_conn
        .patch(externalURL, null, headers)
        .then((d: IHttpResponse) => d);
    }
    const success = resultSwitchStatusUnit?.status === 200;
    
    return new ResponceApiNetwork({
      code: success ? RESPONSE_CODES.SUCCESS : RESPONSE_CODES.INTERNAL_SERVER_ERROR,
      message: success ? 'OK' : JSON.stringify(resultSwitchStatusUnit)
    });
  }
  
  /**
   * Точечное удаление кампании
   * @param id
   * @returns
   */
  private async removeUnit(id: IdCampaign): Promise<ResponceApiNetwork> {
    return this.changeCampaignStatus(id, CampaignStatus.ARCHIVED);
  }
  
  /**
   * Запуск кампании
   */
  async start(): Promise<ResponceApiNetwork> {
    this.handlerErrNotIdCampaign();
    return this.changeCampaignStatus(this.id, CampaignStatus.ACTIVE);
  }

  /**
   * Остановка кампании
   */
  async stop(): Promise<ResponceApiNetwork> {
    this.handlerErrNotIdCampaign();
    return this.changeCampaignStatus(this.id, CampaignStatus.PAUSED);
  }
  
  private async getMinBid(): Promise<ResponseMinBid | null> {
    
    const externalURL = `minimal-bid/`;
    let responseData: ResponseMinBid | null = null;
    if (this.conn.api_conn) {
      const headers = {
        'Content-Type': 'application/json'
      };
      responseData = await this.conn.api_conn
      .get(externalURL, headers)
      .then((d: IHttpResponse) => {
        return new ResponseMinBid(d.data)
      });
    }
    
    return responseData;
    
  }
  
  /**
   * Мин ставка
   * @returns
   */
  async minBid(): Promise<ResponceApiNetwork<BidCampaign>> {
    this.handlerErrNotCountryCampaign();
    const responseMinBid: ResponseMinBid | null = await this.getMinBid();
    let minBidValue = null;
    const countryValue: IResultFullDataCampaignCountryItem = this.conn.network.collections?.countries?.find(
        (f: any) => String(f.country_code) === String(this.country.value)
    );
    
    const minBidArr = responseMinBid?.value?.data;
    if(Array.isArray(minBidArr)) {
      for (const minBidObj of minBidArr) {
        const groups = minBidObj.conditions.groups;
        const isExists = groups.filter((g: IResultMinBidConditionsGroup) =>
            (g.field === "COUNTRY" && g.value === countryValue?.value));
        if(isExists.length) {
          minBidValue = minBidObj.min_bid;
          break;
        }
      }
    }
    
    if(!minBidValue) {
      new Logger(`MinBid not found. Coutry code: [${this.country.value}]`).setTag('').log();
      return new ResponceApiNetwork({ code: RESPONSE_CODES.NOT_FOUND, message: 'OK', data: new BidCampaign(0) });
    }
    
    return new ResponceApiNetwork({ code: RESPONSE_CODES.SUCCESS, message: 'OK', data: new BidCampaign(minBidValue) });
    
  }
  
  /**
   * Статистика
   * @param date
   */
  async stats(date: string): Promise<ResponceApiNetwork<StatsRaw>> {
    throw new Error('Method not implemented.');
  }
  
}
