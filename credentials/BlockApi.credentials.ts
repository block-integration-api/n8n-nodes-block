import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';
import { BLOCK_API_BASE_URL } from '../nodes/BlockBooking/shared/config';

export class BlockApi implements ICredentialType {
	name = 'blockApi';

	icon = {
		light: 'file:../icons/block.svg',
		dark: 'file:../icons/block.dark.svg',
	};

	displayName = 'Block API';

	documentationUrl = 'https://www.useblock.tech/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials?.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: BLOCK_API_BASE_URL,
			url: '/v1/connections',
			method: 'GET',
		},
	};
}

