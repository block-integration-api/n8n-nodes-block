import type {
	IHookFunctions,
	IExecuteFunctions,
	IExecuteSingleFunctions,
	ILoadOptionsFunctions,
	IHttpRequestMethods,
	IDataObject,
	IHttpRequestOptions,
} from 'n8n-workflow';

export async function blockApiRequest(
	this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject | undefined = undefined,
	qs: IDataObject = {},
): Promise<any> {
	const credentials = await this.getCredentials('blockApi');
	const baseUrl = (credentials.baseUrl as string) || 'https://api.useblock.tech';

	const options: IHttpRequestOptions = {
		method,
		qs,
		body,
		url: `${baseUrl}${endpoint}`,
		json: true,
	};

	return this.helpers.httpRequestWithAuthentication.call(this, 'blockApi', options);
}

