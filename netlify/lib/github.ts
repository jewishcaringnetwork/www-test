import { createSign } from 'node:crypto';

const API = 'https://api.github.com';
const BASE_HEADERS = {
	Accept: 'application/vnd.github+json',
	'X-GitHub-Api-Version': '2022-11-28',
};

const env = (k: string) => {
	const v = Netlify.env.get(k);
	if (!v) throw new Error(`Missing env var ${k}`);
	return v;
};

const b64url = (s: string) => Buffer.from(s).toString('base64url');

function appJwt(): string {
	const now = Math.floor(Date.now() / 1000);
	const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
	const payload = b64url(
		JSON.stringify({ iat: now - 60, exp: now + 540, iss: env('GH_APP_ID') }),
	);
	const key = Buffer.from(env('GH_APP_PRIVATE_KEY'), 'base64').toString('utf8');
	const sig = createSign('RSA-SHA256').update(`${header}.${payload}`).sign(
		key,
		'base64url',
	);
	return `${header}.${payload}.${sig}`;
}

/** Returns a fetch wrapper bound to a fresh installation token. Call once per tool call. */
export async function github() {
	const res = await fetch(
		`${API}/app/installations/${env('GH_INSTALLATION_ID')}/access_tokens`,
		{
			method: 'POST',
			headers: { ...BASE_HEADERS, Authorization: `Bearer ${appJwt()}` },
		},
	);
	if (!res.ok) {
		throw new Error(`GitHub token: ${res.status} ${await res.text()}`);
	}
	const { token } = await res.json();

	return async function gh<T = any>(
		path: string,
		init: RequestInit = {},
	): Promise<T> {
		const r = await fetch(`${API}${path}`, {
			...init,
			headers: {
				...BASE_HEADERS,
				Authorization: `Bearer ${token}`,
				...init.headers,
			},
		});
		if (!r.ok) {
			throw new Error(
				`GitHub ${init.method ?? 'GET'} ${path}: ${r.status} ${await r.text()}`,
			);
		}
		return (r.status === 204 ? undefined : await r.json()) as T;
	};
}

export const repoPath = () => `/repos/${env('GH_OWNER')}/${env('GH_REPO')}`;
