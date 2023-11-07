import { IResponse } from "./IResponse";

export interface IResultDataStatsTableGroupSiteId {
  id: number;
  name: number;
  field_name: string;
  icon: string;
}
export interface IResultDataStatsTableGroup {
  SiteId: IResultDataStatsTableGroupSiteId;
}
export interface IResultDataStatsTableMetric {
  Impression: number;
  AdvertiserSpent: number;
}
export interface IResultStatsTableData {
  metric: IResultDataStatsTableMetric;
  group: IResultDataStatsTableGroup;
}

export default class ResponseStatsTable {
  constructor(readonly _value: IResponse<IResultStatsTableData[]>) {}

  get value(): IResponse<IResultStatsTableData[]> {
    return this._value;
  }
}