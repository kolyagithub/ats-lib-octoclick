import { RESPONSE_CODES } from '../../consts';
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
  StatsRaw, NameCampaign, TargetUrlCampaign, CountryCampaign, BrowserVersionCampaign
} from "@atsorganization/ats-lib-ntwk-common";
import ResponseCreative from './api/ResponseCreative';
import DataCreative from './api/DataCreative';
import ResponseCampaign from './api/ResponseCampaign';
import { IResultFullDataCampaignCountryItem } from "./Octoclick";
import { AdType, CampaignStatus, CreativeStatus, FilterType } from "./api/Enums";
import { status } from "@atsorganization/ats-lib-ntwk-common/lib/models/StatusCampaign";
import { Logger } from "@atsorganization/ats-lib-logger";
import ResponseMinBid, { IResultMinBidConditionsGroup } from "./api/ResponseMinBid";
import FullDataCampaign, { IResultFullDataCampaignDataTargetingIpList } from './api/FullDataCampaign';
import DataCampaign from "./api/DataCampaign";

export default class OctoclickCampaign extends Campaign {
  
  /**
   * Создание кампании
   * @param data
   * @returns
   */
  async create(data: ICampaign): Promise<ResponceApiNetwork<Campaign>> {
    const { name, template_id, bid, country, placements_data, target_url, schedule, browser_version } = data;
    
    try {
      
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
      .setPlacements(placements_data.value)
      .setBrowserVersion(browser_version.value)
      .setSchedule(schedule);
      
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
        .setStatus(new StatusCampaign('moderation'))
        .setBrowserVersion(browser_version)
        .setSchedule(new ScheduleCampaign(schedule?.value));
        
        return new ResponceApiNetwork({ code: RESPONSE_CODES.SUCCESS, message: 'OK', data: this });
      } else {
        await this.removeUnit(new IdCampaign(newCampId));
        return new ResponceApiNetwork({
          code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
          message: JSON.stringify(newCreative) + ' add creative'
        });
      }
      
    } catch (error) {
      return new ResponceApiNetwork({
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        message: 'error create campaign'
      });
    }
    
  }
  
  /**
   * Обновление кампании
   */
  async update(): Promise<ResponceApiNetwork<Campaign>> {
    const { target_url } = this;
    
    try {
      
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
      
      const { value: {
        campaign: { bcid: updatedCampId, name,  targeting, status: statusCampaign },
        creative: { bcid: updatedCreativeId, bid_to, status: statusCreative }
      }} =  fullDataCampaign;
      
      const dataCreative = DataCreative.fromFullDataCampaign(fullDataCampaign);
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
      .setName(new NameCampaign(name))
      .setTargetUrl(target_url)
      .setCountry(
          new CountryCampaign(
              this.conn.network.collections?.countries?.find(
                  (f: any) => String(f.value) === String(targeting.countries[0])
              ))
      )
      .setBid(new BidCampaign(Number(bid_to)))
      .setPlacementsData(
          new PlacementCampaign({
            list: [...new Set(targeting.ip_list.map((obj: IResultFullDataCampaignDataTargetingIpList) => obj.range))] ?? [],
            type: targeting.ip_list[0].filter_type === FilterType.DENY ?? false
          })
      )
      .setStatus(this.prepareStatus(statusCampaign, statusCreative))
      .setBrowserVersion(new BrowserVersionCampaign(Number(targeting.browser_version[0] ?? 0)))
      .setSchedule(this.transformSchedule(targeting.schedule));
      
      return new ResponceApiNetwork({ code: RESPONSE_CODES.SUCCESS, message: 'OK', data: this });
      
    } catch (error) {
      return new ResponceApiNetwork({
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        message: 'error update campaign'
      });
    }
    
  }
  
  /**
   * Установка расписания кампании
   * по-умолчанию полное расписание
   * @param schedule
   */
  async updateSchedule(schedule: ScheduleCampaign = new ScheduleCampaign()): Promise<ResponceApiNetwork<Campaign>> {
    throw Error('Method not implemented');
  }
  
  /**
   * Трансформация расписания в нуждный формат
   * @param weekHours[]
   * @returns
   */
  private transformSchedule(weekHours: number[]): ScheduleCampaign {
   
    const between = (x: number, min: number, max: number) => {
      return x >= min && x <= max;
    };
    const result: any = [];
    
    for (let weekHour of weekHours) {
      if(between(weekHour, 0, 23)) {
        result.push('Mon' + weekHour.toString().padStart(2, '0'));
      }
      if(between(weekHour, 24, 47)) {
        weekHour -= 24;
        result.push('Tue' + weekHour.toString().padStart(2, '0'));
      }
      if(between(weekHour, 48, 71)) {
        weekHour -= 48;
        result.push('Wed' + weekHour.toString().padStart(2, '0'));
      }
      if(between(weekHour, 72, 95)) {
        weekHour -= 72;
        result.push('Thu' + weekHour.toString().padStart(2, '0'));
      }
      if(between(weekHour, 96, 119)) {
        weekHour -= 96;
        result.push('Fri' + weekHour.toString().padStart(2, '0'));
      }
      if(between(weekHour, 120, 143)) {
        weekHour -= 120;
        result.push('Sat' + weekHour.toString().padStart(2, '0'));
      }
      if(between(weekHour, 144, 167)) {
        weekHour -= 144;
        result.push('Sun' + weekHour.toString().padStart(2, '0'));
      }
    }
    
    return new ScheduleCampaign(result);
  }
  
  /**
   * Вытянуть все данные по кампании из сети
   */
  async fetch(): Promise<ResponceApiNetwork<Campaign>> {
    this.handlerErrNotIdCampaign();

    try {
      
      const fullDataResponse: FullDataCampaign | null = await this.getFullDataCampaign(this.id);
      if (!fullDataResponse) {
        return new ResponceApiNetwork({
          code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
          message: 'Not get data from network'
        });
      }

      const {
        campaign: { bcid, name, targeting, status: statusCampaign },
        creative: { target_url, bid_to, status: statusCreative }
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
            list: [...new Set(targeting.ip_list.map((obj: IResultFullDataCampaignDataTargetingIpList) => obj.range))] ?? [],
            type: targeting.ip_list[0].filter_type === FilterType.DENY ?? false
          })
      )
      .setStatus(this.prepareStatus(statusCampaign, statusCreative))
      .setBrowserVersion(new BrowserVersionCampaign(Number(targeting.browser_version[0] ?? 0)))
      .setSchedule(this.transformSchedule(targeting.schedule));
      return new ResponceApiNetwork({ code: RESPONSE_CODES.SUCCESS, message: 'OK', data: this });
      
    } catch (error) {
      return new ResponceApiNetwork({
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        message: 'error fetch campaign'
      });
    }
    
  }
  
  /**
   * Подготовка корректного статуса для API
   * @param statusCampaign
   * @param statusCreative
   * @returns
   */
  private prepareStatus(statusCampaign: number, statusCreative: number): StatusCampaign {
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
    throw new Error('Method not implemented.');
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
    
    try {
      
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
      
    } catch (error) {
      return new ResponceApiNetwork({
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        message: 'error when change campaign status'
      });
    }
    
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
    
    const externalURL = `minimal-bid?page[size]=100`;
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
    
    try {
      
      const responseMinBid: ResponseMinBid | null = await this.getMinBid();
      const minBidValues: number[] = [];
      const countryValue: IResultFullDataCampaignCountryItem = this.conn.network.collections?.countries?.find(
          (f: any) => String(f.country_code) === String(this.country?.value)
      );
      
      const minBidArr = responseMinBid?.value?.data;
      if(Array.isArray(minBidArr)) {
        for (const minBidObj of minBidArr) {
          const groups = minBidObj.conditions.groups;
          const isExistsCountry = groups.filter((g: IResultMinBidConditionsGroup) =>
              (g.field === "COUNTRY" && g.value === countryValue?.value)
          );
          const isExistsAd = groups.filter((g: IResultMinBidConditionsGroup) =>
              (g.field === "AD_TYPE" && g.value === AdType.POPUNDER)
          );
          if(isExistsCountry.length && isExistsAd.length) {
            minBidValues.push(minBidObj.min_bid);
          }
        }
      }
      
      if(!minBidValues.length) {
        new Logger(`MinBid not found. Country code: [${this.country.value}]`).setTag('').log();
        return new ResponceApiNetwork({ code: RESPONSE_CODES.NOT_FOUND, message: 'OK', data: new BidCampaign(0) });
      }
      
      return new ResponceApiNetwork({ code: RESPONSE_CODES.SUCCESS, message: 'OK', data: new BidCampaign(Math.min(...minBidValues)) });
      
    } catch (error) {
      return new ResponceApiNetwork({
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        message: 'error get MinBid()'
      });
    }
    
    
  }
  
  /**
   * Статистика
   * @param date
   */
  async stats(date: string): Promise<ResponceApiNetwork<StatsRaw>> {
    throw new Error('Method not implemented.');
  }
  
}
