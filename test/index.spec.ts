import Octoclick from "../lib/index";
import RedisCache from "@atsorganization/ats-lib-redis";
import { NetworkConnection } from "@atsorganization/ats-lib-ntwk-common";

test('Should return helloWorld', async () => {
    const octoclick = new Octoclick(
        String(process.env.LOGIN_OCTOCLICK),
        String(process.env.PASSWORD_OCTOCLICK),
        '',
        new RedisCache(
            6379,
            "localhost"
        )
    );
    const conn: NetworkConnection = await octoclick.createConnection();
    expect(conn).toBe('Hello world!')
})