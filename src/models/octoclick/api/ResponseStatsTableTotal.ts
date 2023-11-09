import { IResponse } from "./IResponse";

export interface IResultDataStatsTableMetric {
  Impression: number;
  AdvertiserSpent: number;
}
export interface IResultStatsTableTotalData {
  metric: IResultDataStatsTableMetric;
}

export default class ResponseStatsTableTotal {
  constructor(readonly _value: IResponse<IResultStatsTableTotalData>) {}

  get value(): IResponse<IResultStatsTableTotalData> {
    return this._value;
  }
}