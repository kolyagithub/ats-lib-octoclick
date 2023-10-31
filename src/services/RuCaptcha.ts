import axios from "axios";
import { RU_CAPTCHA_BASE_URL } from "../consts";

export default class RuCaptcha {
    private api_key: any;
    private min_await_sec: number = 10;
    private base_url: any = RU_CAPTCHA_BASE_URL;
    constructor(api_key: any) {
        this.api_key = api_key;
    }

    async sendReCaptcha(site_key: any, site_url: any): Promise<any> {
        const url = this.base_url + 'in.php'
        const method = 'turnstile';
        const params = 'key=' + this.api_key + '&method=' + method + '&sitekey=' + site_key + '&pageurl=' + site_url + '&json=1';
        console.log('RuCaptcha request: ', url, params);
        const rucapthaRes = await axios.post(url, params);
        console.log('RuCaptcha response: ', rucapthaRes);
        return rucapthaRes.data.split('|')[1];
    }

    async result(id: any): Promise<any> {
        const await_sec = this.min_await_sec * 1000;
        const url = this.base_url + 'res.php'
        const params = 'key=' + this.api_key + '&action=get&id=' + id + '&json=1';
        console.log('id_resolve_recapcha', id);
        let promise = 'CAPCHA_NOT_READY';
        while (promise === 'CAPCHA_NOT_READY') {
            promise = await new Promise((resolve, reject) => {
                setTimeout(async () => {
                    resolve(await axios.get(url + '?' + params).then(r => r.data));
                }, await_sec);
            });
            console.log('id_resolve_recapcha response: ', promise);
        }
        return promise.split('|')[1];
    }
}