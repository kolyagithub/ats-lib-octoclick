import { IResultFullDataCampaignData } from './FullDataCampaign';
import { IResponse } from "./IResponse";

export default class ResponseCampaign {
  constructor(readonly _value: IResponse<IResultFullDataCampaignData>) {}

  get value(): IResponse<IResultFullDataCampaignData> {
    return this._value;
  }
}