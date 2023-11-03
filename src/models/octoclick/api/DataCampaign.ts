import FullDataCampaign, {
  IResultFullDataCampaignDataSettings,
  IResultFullDataCampaignDataTargeting, IResultFullDataCampaignDataTargetingIpList
} from "./FullDataCampaign";
import { IResultFullDataCampaignCountryItem } from "../Octoclick";
import { PlacementType } from "./Enums";

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
    const newPlacementType: PlacementType = type ? PlacementType.BLACK_LIST : PlacementType.WHITE_LIST;
    
    for (const ip of list) {
      
      // check to exists
      const existsIp: IResultFullDataCampaignDataTargetingIpList[] = this._value.targeting.ip_list
      .filter(obj => obj.range === ip);
      
      if(existsIp) {
        this._value.targeting.ip_list = this._value.targeting.ip_list
        .filter(item => item.range !== ip);
      }
      
      // add new
      this._value.targeting.ip_list.push({
        range: ip,
        filter_type: newPlacementType
      })
      
    }
    
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
