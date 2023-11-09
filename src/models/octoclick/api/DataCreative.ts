import FullDataCampaign, {
  IResultFullDataCreativeDataBidCondition
} from "./FullDataCampaign";

export interface IDataCreative {
  name: string | null;
  text: string;
  target_url: string;
  ad_type: number;
  status_after_moderation: number | null;
  media_id: number;
  bid_to: number;
  bid_conditions: IResultFullDataCreativeDataBidCondition[] | null;
  use_campaign_targeting: boolean | null;
}

export default class DataCreative {
  constructor(readonly _value: IDataCreative) {}

  get value(): IDataCreative {
    return this._value;
  }

  setName(name: string): DataCreative {
    this._value.name = name;
    return this;
  }

  setBid(bid: number): DataCreative {
    this._value.bid_to = bid;
    return this;
  }
  
  setTargetUrl(targetUrl: string): DataCreative {
    this._value.target_url = targetUrl;
    return this;
  }

  static fromFullDataCampaign(fullDataCampaign: FullDataCampaign): DataCreative {
    const {
      creative: {
        ad_type,
        status_after_moderation,
        name,
        text,
        target_url,
        media_id,
        bid_to,
        bid_conditions,
        use_campaign_targeting
      }
    } = fullDataCampaign.value;
    return new DataCreative({
      name,
      text,
      target_url,
      ad_type,
      status_after_moderation,
      media_id,
      bid_to,
      bid_conditions,
      use_campaign_targeting
    });
  }
}
