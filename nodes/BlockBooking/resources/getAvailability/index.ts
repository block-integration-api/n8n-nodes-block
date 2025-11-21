import type { INodeProperties } from 'n8n-workflow';
import { connectionIdField, pollingConfigFields } from '../../shared/descriptions';
import { executeGetAvailability } from './execute';

const showOnlyForGetAvailability = {
	operation: ['getAvailability'],
};

export const getAvailabilityDescription: INodeProperties[] = [
	{
		...connectionIdField,
		displayOptions: {
			show: showOnlyForGetAvailability,
		},
	},
	{
		displayName: 'Start Date',
		name: 'startDate',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: {
			show: showOnlyForGetAvailability,
		},
		description:
			'Start of availability search window in ISO 8601 format. Timezone information should be included in the datetime string (e.g., 2025-11-15T00:00:00-08:00 for Pacific Time).',
	},
	{
		displayName: 'End Date',
		name: 'endDate',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: {
			show: showOnlyForGetAvailability,
		},
		description:
			'End of availability search window in ISO 8601 format. Timezone information should be included in the datetime string (e.g., 2025-11-22T23:59:59-08:00 for Pacific Time).',
	},
	{
		displayName: 'Provider',
		name: 'provider',
		type: 'string',
		default: '',
		displayOptions: {
			show: showOnlyForGetAvailability,
		},
		description:
			'Provider name or identifier. If not provided, availability is aggregated across all providers.',
	},
	{
		displayName: 'Duration (minutes)',
		name: 'duration',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: '',
		displayOptions: {
			show: showOnlyForGetAvailability,
		},
		description: 'Desired appointment duration in minutes',
	},
	{
		displayName: 'Business Hours',
		name: 'businessHours',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: false,
		},
		default: {},
		displayOptions: {
			show: showOnlyForGetAvailability,
		},
		description:
			'Business hours constraint. If not provided, platform-specific behavior applies (e.g., lookup from UI).',
		options: [
			{
				displayName: 'Hours',
				name: 'businessHours',
				values: [
					{
						displayName: 'Start Time',
						name: 'start',
						type: 'string',
						default: '',
						required: true,
						description: 'Business hours start time (e.g., 09:00)',
					},
					{
						displayName: 'End Time',
						name: 'end',
						type: 'string',
						default: '',
						required: true,
						description: 'Business hours end time (e.g., 17:00)',
					},
				],
			},
		],
	},
	...pollingConfigFields.map((field) => ({
		...field,
		displayOptions: {
			show: showOnlyForGetAvailability,
		},
	})),
];

export { executeGetAvailability };

