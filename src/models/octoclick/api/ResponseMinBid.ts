import { IResponse } from "./IResponse";

export interface IResultMinBidConditionsGroup {
  field: string;
  operator: string;
  value: number;
}
export interface IResultMinBidConditions {
  groups: IResultMinBidConditionsGroup;
  logicBetween: string;
}
export interface IResultMinBid {
  bcid: number;
  conditions: IResultMinBidConditions;
  minBid: number;
  translations: any;
}

export default class ResponseMinBid {
  
  constructor(readonly _value: IResponse<IResultMinBid>) {}

  get value(): IResponse<IResultMinBid> {
    return this._value;
  }
  
}
