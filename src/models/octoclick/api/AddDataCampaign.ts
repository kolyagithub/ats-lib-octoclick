import FullDataCampaign, {
    IResultFullDataCampaignDataSettings,
    IResultFullDataCampaignDataTargeting
} from "./FullDataCampaign";
import { IResultFullDataCampaignCountryItem } from "../Octoclick";

export interface IAddDataCampaign {
  name: string;
  adv_category_id: number;
  adv_category_iab: string[];
  goal_id: number;
  settings: IResultFullDataCampaignDataSettings | null;
  tracking_link_preset_id: number | null;
  targeting: IResultFullDataCampaignDataTargeting;
}

export default class AddDataCampaign {
  constructor(readonly _value: IAddDataCampaign) {}

  get value(): IAddDataCampaign {
    return this._value;
  }

  setName(name: string): AddDataCampaign {
    this._value.name = name;
    return this;
  }
  
  setCountry(country: IResultFullDataCampaignCountryItem): AddDataCampaign {
    this._value.targeting.countries = [country.value];
    return this;
  }
  
  static fromFullDataCampaign(fullDataCampaign: FullDataCampaign): AddDataCampaign {
    const {
      campaign: {
        name,
        adv_category_id,
        adv_category_iab,
        goal_id,
        settings,
        tracking_link_preset_id,
        targeting
      }
    } = fullDataCampaign.value;
    return new AddDataCampaign({
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
