export enum CampaignStatus {
  ACTIVE = 1,
  PAUSED = 2,
  ARCHIVED = 3
}
export interface ISwitchStatusDataCampaign {
  campaigns: { type: string; include: number[]; exclude: number[] };
  status: CampaignStatus;
  showStopped: boolean;
  showDeleted: boolean;
}

export default class SwitchStatusDataCampaign {
  constructor(readonly _value: ISwitchStatusDataCampaign) {}

  get value(): ISwitchStatusDataCampaign {
    return this._value;
  }
}
