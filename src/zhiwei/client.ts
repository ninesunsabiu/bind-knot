import * as R from 'ramda';
import * as Rx from 'rxjs';
import * as RxOp from 'rxjs/operators';
import wretch,  { type Wretch } from 'wretch';

import { login } from './api/login.js';

export type ZhiweiClientOption = {
    baseUrl?: string;
    username: string;
    password: string;
    orgIdentity: string;
};

export type ZhiweiClient = { fetcher: Wretch; orgId: string };

export const ofClient = (options: ZhiweiClientOption) => {
    const {
        baseUrl,
        username,
        password,
        orgIdentity
    } = options;

    const fetcher = wretch(baseUrl).headers({
        'org-identity': orgIdentity,
        'Accept-Language': 'zh-CN'
    });

    const authFetcher = () => {
        return Rx.defer(() => login(fetcher)(username, password))
            .pipe(RxOp.mergeMap((it) => (R.isNotNil(it) ? Rx.of(it) : Rx.throwError(() => new Error('Login failed')))))
            .pipe(RxOp.retry(3));
    };

    const source$ = authFetcher().pipe(
        RxOp.map((cookie): ZhiweiClient => {
            const f = fetcher.headers({ Cookie: cookie }).catcher(401, (_, request) => {
                return authFetcher().pipe(RxOp.map((cookie) => request.headers({ Cookie: cookie })));
            });

            const orgId = orgIdentity;

            return { fetcher: f, orgId };
        })
    );

    return Rx.firstValueFrom(source$);
};
