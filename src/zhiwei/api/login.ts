import { Wretch } from "wretch";

export const login = (fetcher: Wretch) => {
    return (username: string, password: string) => {
        return fetcher
            .headers({
                'Content-Type': 'application/json',
                'User-Agent': 'Mobile_Zhiwei'
            })
            .post({ username, password }, '/login')
            .res((res) => res.headers.get('set-cookie'))
    }
}