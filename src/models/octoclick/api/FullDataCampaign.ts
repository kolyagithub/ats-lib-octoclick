export interface IResultFullDataCreativeDataTemplate {
  bcid: number | null;
  variables: any;
}
export interface IResultFullDataCreativeDataFrequency {
  limit: number;
  period: number;
}
export interface IResultFullDataCreativeDataBidConditionConfGroups {
  field: string;
  operator: string;
  value: number;
}
export interface IResultFullDataCreativeDataBidConditionConf {
  groups: IResultFullDataCreativeDataBidConditionConfGroups;
  logic_between: string;
}
export interface IResultFullDataCreativeDataBidCondition {
  bid_to: number;
  configuration: IResultFullDataCreativeDataBidConditionConf;
}
export interface IResultFullDataCreativeData {
  bcid: string;
  campaign_id: number;
  ad_type: number;
  status: number;
  internal_comment: string;
  name: string | null;
  text: string;
  target_url: string;
  media_id: number;
  media: any | null;
  template: IResultFullDataCreativeDataTemplate;
  bid_to: number;
  bid_type: number;
  bid_conditions: IResultFullDataCreativeDataBidCondition[] | null;
  use_campaign_targeting: boolean | null;
  created_at: number;
  updated_at: number;
  frequency: IResultFullDataCreativeDataFrequency[];
  status_after_moderation: number | null;
}

export interface IResultFullDataCampaignDataSettings {
  bcid: number;
  money_hourly_limit: number;
  is_autobidder_enabled: boolean;
  autobidder_margin: number;
  is_trusted: boolean;
}
export interface IResultFullDataCampaignDataTargetingIpList {
  range: string;
  filter_type: number;
}
export interface IResultFullDataCampaignDataTargeting {
  bcid: number;
  device_types: string[];
  device_types_filter_type: number;
  device_vendors: string[];
  device_vendors_filter_type: number;
  browsers: string[];
  browsers_filter_type: number;
  browser_version: string[];
  browser_version_filter_type: number;
  os: string[];
  os_filter_type: number;
  os_version: string[];
  os_version_filter_type: number;
  countries: number[];
  countries_filter_type: number;
  regions: number[];
  regions_filter_type: number;
  operators: number[];
  operators_filter_type: number;
  languages: string[];
  languages_filter_type: number;
  site_list_ids: number[];
  site_list_ids_filter_type: number;
  ip_list: IResultFullDataCampaignDataTargetingIpList[];
  site_categories: string[];
  site_categories_filter_type: number;
  schedule_time_zone: number;
  schedule: number[];
  schedule_filter_type: number;
}
export interface IResultFullDataCampaignData {
  bcid: string;
  name: string;
  status: number;
  tracking_link_preset_id: number | null;
  goal_id: number;
  settings: IResultFullDataCampaignDataSettings;
  targeting: IResultFullDataCampaignDataTargeting;
  created_at: number;
  updated_at: number;
  frequency: string[];
  adv_category_iab: string[];
  adv_category_id: number;
}

export interface IResultFullDataCampaign {
  campaign: IResultFullDataCampaignData;
  creative: IResultFullDataCreativeData;
}

export default class FullDataCampaign {
  constructor(readonly _value: IResultFullDataCampaign) {}

  get value(): IResultFullDataCampaign {
    return this._value;
  }
}
