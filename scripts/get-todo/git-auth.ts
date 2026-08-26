/**
 * Build a GitHub Git transport environment without putting the PAT in argv.
 *
 * GitHub API requests commonly accept Bearer auth, but Git smart HTTP expects
 * the PAT as the password in Basic auth for the extraheader form.
 */
export function commandEnvironment(token?: string): NodeJS.ProcessEnv {
	const environment: NodeJS.ProcessEnv = { ...process.env, GIT_TERMINAL_PROMPT: "0" };
	if (token) {
		const credentials = Buffer.from(`x-access-token:${token}`, "utf8").toString("base64");
		environment.GIT_CONFIG_COUNT = "1";
		environment.GIT_CONFIG_KEY_0 = "http.https://github.com/.extraheader";
		environment.GIT_CONFIG_VALUE_0 = `AUTHORIZATION: basic ${credentials}`;
	}
	return environment;
}
