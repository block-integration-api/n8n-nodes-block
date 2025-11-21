import type { INodeProperties } from 'n8n-workflow';

export const connectionIdField: INodeProperties = {
	displayName: 'Connection ID',
	name: 'connectionId',
	type: 'string',
	default: '',
	required: true,
	description: 'ID of the connection to the booking platform',
};

export const pollingConfigFields: INodeProperties[] = [
	{
		displayName: 'Poll Interval (Seconds)',
		name: 'pollInterval',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 60,
		},
		default: 2,
		description: 'How often to poll for job completion (in seconds)',
	},
	{
		displayName: 'Poll Timeout (Seconds)',
		name: 'pollTimeout',
		type: 'number',
		typeOptions: {
			minValue: 10,
			maxValue: 600,
		},
		default: 180,
		description: 'Maximum time to wait for job completion (in seconds)',
	},
];

