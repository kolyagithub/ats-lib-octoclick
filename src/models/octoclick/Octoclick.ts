import { ICollectionsNetwork, Network, NetworkConnection } from '@atsorganization/ats-lib-ntwk-common';
import OctoclickConnection from './OctoclickConnection';
import RedisCache from '@atsorganization/ats-lib-redis';

export interface IResultFullDataCampaignCountryItem {
  value: number;
  label: string;
  country_code: string;
}
interface ICollectionsOctoclick extends ICollectionsNetwork {
  countries: IResultFullDataCampaignCountryItem[];
}
export default class Octoclick extends Network {
  collections?: ICollectionsOctoclick;
  constructor(login: string, password: string, api_key: string, redisCache: RedisCache = new RedisCache()) {
    super(login, password, api_key, redisCache);
    this.base_url_api = 'https://api.octoclick.com/api/v3/';
    this.base_url_admin = 'https://api.octoclick.com/api/v3/';
    this.name = 'octoclick';
    this.collections = { countries: [] };
  }
  async createConnection(): Promise<NetworkConnection> {
    return await new OctoclickConnection(this).open();
  }
}
