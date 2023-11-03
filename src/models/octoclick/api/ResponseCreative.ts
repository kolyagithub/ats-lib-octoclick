import { IResultFullDataCreativeData } from './FullDataCampaign';
import { IResponse } from "./IResponse";

export default class ResponseCreative {
  
  constructor(readonly _value: IResponse<IResultFullDataCreativeData>) {}

  get value(): IResponse<IResultFullDataCreativeData> {
    return this._value;
  }
  
}
