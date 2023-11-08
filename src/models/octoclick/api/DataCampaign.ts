import FullDataCampaign, {
  IResultFullDataCampaignDataSettings,
  IResultFullDataCampaignDataTargeting,
  IResultFullDataCampaignDataTargetingIpList
} from "./FullDataCampaign";
import { IResultFullDataCampaignCountryItem } from "../Octoclick";
import { FilterType } from "./Enums";
import { ScheduleCampaign } from "@atsorganization/ats-lib-ntwk-common";

export interface IDataCampaign {
  bcid: string | null;
  name: string;
  adv_category_id: number;
  adv_category_iab: string[];
  goal_id: number;
  settings: IResultFullDataCampaignDataSettings | null;
  tracking_link_preset_id: number | null;
  targeting: IResultFullDataCampaignDataTargeting;
}

export default class DataCampaign {
  constructor(readonly _value: IDataCampaign) {}

  get value(): IDataCampaign {
    return this._value;
  }

  setId(bcid: string): DataCampaign {
    this._value.bcid = bcid;
    return this;
  }
  
  setName(name: string): DataCampaign {
    this._value.name = name;
    return this;
  }
  
  setCountry(country: IResultFullDataCampaignCountryItem): DataCampaign {
    this._value.targeting.countries = [country.value];
    return this;
  }
  
  setPlacements(placements: { list: any[]; type: boolean } | null): DataCampaign {
    
    if(!placements) {
      return this;
    }
    
    const { list, type } = placements;
    const newPlacementType: FilterType = type ? FilterType.DENY : FilterType.ALLOW;
    
    this._value.targeting.site_list_ids = [...new Set(list ?? [])];
    this._value.targeting.site_list_ids_filter_type = newPlacementType;
    
    return this;
    
  }
  
  setBrowserVersion(version: number | null): DataCampaign {
    if(!version) {
      return this;
    }
    this._value.targeting.browser_version = [version.toString()];
    this._value.targeting.browser_version_filter_type = FilterType.ALLOW;
    return this;
  }
  
  setSchedule(rawSchedule: ScheduleCampaign | undefined): DataCampaign {
    if(!rawSchedule) {
      return this;
    }
    
    const reversedSchedule: number[] = [];
    for (const str of rawSchedule.value) {
      
      const day = str.substring(0, 3).toLowerCase();
      const hour = parseInt(str.substring(3), 10);

      switch (day) {
        case 'mon': reversedSchedule.push(hour);
          break;
        case 'tue': reversedSchedule.push(hour + 24);
          break;
        case 'wed': reversedSchedule.push(hour + 48);
          break;
        case 'thu': reversedSchedule.push(hour + 72);
          break;
        case 'fri': reversedSchedule.push(hour + 96);
          break;
        case 'sat': reversedSchedule.push(hour + 120);
          break;
        case 'sun': reversedSchedule.push(hour + 144);
          break;
      }
      
    }
    
    this._value.targeting.schedule = reversedSchedule;
    return this;
  }
  
  static fromFullDataCampaign(fullDataCampaign: FullDataCampaign): DataCampaign {
    const {
      campaign: {
        bcid,
        name,
        adv_category_id,
        adv_category_iab,
        goal_id,
        settings,
        tracking_link_preset_id,
        targeting
      }
    } = fullDataCampaign.value;
    return new DataCampaign({
      bcid,
      name,
      adv_category_id,
      adv_category_iab,
      goal_id,
      settings,
      tracking_link_preset_id,
      targeting
    });
  }
}
