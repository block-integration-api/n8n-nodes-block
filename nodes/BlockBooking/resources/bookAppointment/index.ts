import type { INodeProperties } from 'n8n-workflow';
import { connectionIdField, pollingConfigFields } from '../../shared/descriptions';
import { executeBookAppointment } from './execute';

const showOnlyForBookAppointment = {
	operation: ['bookAppointment'],
};

export const bookAppointmentDescription: INodeProperties[] = [
	{
		...connectionIdField,
		displayOptions: {
			show: showOnlyForBookAppointment,
		},
	},
	{
		displayName: 'Date & Time',
		name: 'datetime',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: {
			show: showOnlyForBookAppointment,
		},
		description: 'Appointment date and time in ISO 8601 format',
	},
	{
		displayName: 'Provider',
		name: 'provider',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: showOnlyForBookAppointment,
		},
		description: 'Provider name or identifier',
	},
	{
		displayName: 'Service',
		name: 'service',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: showOnlyForBookAppointment,
		},
		description: 'Service name',
	},
	{
		displayName: 'Customer',
		name: 'customer',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: false,
		},
		default: {},
		required: true,
		displayOptions: {
			show: showOnlyForBookAppointment,
		},
		options: [
			{
				displayName: 'Customer Details',
				name: 'customer',
				values: [
					{
						displayName: 'First Name',
						name: 'firstName',
						type: 'string',
						default: '',
						required: true,
					},
					{
						displayName: 'Last Name',
						name: 'lastName',
						type: 'string',
						default: '',
						required: true,
					},
					{
						displayName: 'Phone',
						name: 'phone',
						type: 'string',
						default: '',
						required: true,
						description: 'Customer phone number (E.164 format recommended, e.g., +12065551212)',
					},
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						default: '',
						required: false,
						description: 'Customer email address',
					},
				],
			},
		],
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
			show: showOnlyForBookAppointment,
		},
		description: 'Appointment duration in minutes',
	},
	{
		displayName: 'Note',
		name: 'note',
		type: 'string',
		typeOptions: {
			rows: 3,
		},
		default: '',
		displayOptions: {
			show: showOnlyForBookAppointment,
		},
		description: 'Appointment notes or special instructions',
	},
	{
		displayName: 'Timezone',
		name: 'timezone',
		type: 'string',
		default: 'America/Los_Angeles',
		displayOptions: {
			show: showOnlyForBookAppointment,
		},
		description: 'Timezone ID (e.g., America/Los_Angeles). Defaults to America/Los_Angeles if not provided',
	},
	{
		displayName: 'Service Address',
		name: 'serviceAddress',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: false,
		},
		default: {},
		displayOptions: {
			show: showOnlyForBookAppointment,
		},
		description: 'Service address for customer creation (used when customer is not found in search)',
		options: [
			{
				displayName: 'Address Details',
				name: 'serviceAddress',
				values: [
					{
						displayName: 'Address',
						name: 'address',
						type: 'string',
						default: '',
						required: true,
						description: 'Street address',
					},
					{
						displayName: 'City',
						name: 'city',
						type: 'string',
						default: '',
						required: true,
					},
					{
						displayName: 'State',
						name: 'state',
						type: 'string',
						default: '',
						required: true,
						description: 'State or province',
					},
					{
						displayName: 'ZIP Code',
						name: 'zipCode',
						type: 'string',
						default: '',
						required: true,
						description: 'ZIP or postal code',
					},
					{
						displayName: 'Country',
						name: 'country',
						type: 'string',
						default: '',
						required: true,
					},
					{
						displayName: 'Room',
						name: 'room',
						type: 'string',
						default: '',
						required: false,
						description: 'Room, apartment, or building number',
					},
				],
			},
		],
	},
	...pollingConfigFields.map((field) => ({
		...field,
		displayOptions: {
			show: showOnlyForBookAppointment,
		},
	})),
];

export { executeBookAppointment };

