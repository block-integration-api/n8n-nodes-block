import {
	NodeConnectionTypes,
	NodeOperationError,
	type INodeType,
	type INodeTypeDescription,
	type IExecuteFunctions,
} from 'n8n-workflow';
import { bookAppointmentDescription, executeBookAppointment } from './resources/bookAppointment';
import { getAvailabilityDescription, executeGetAvailability } from './resources/getAvailability';
import { BLOCK_API_BASE_URL } from './shared/config';

export class BlockBooking implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Block Booking',
		name: 'blockBooking',
		icon: { light: 'file:../../icons/block.svg', dark: 'file:../../icons/block.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Book appointments and check availability using the Block API',
		defaults: {
			name: 'Block Booking',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'blockApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: BLOCK_API_BASE_URL,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Booking',
						value: 'booking',
					},
				],
				default: 'booking',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['booking'],
					},
				},
				options: [
					{
						name: 'Book Appointment',
						value: 'bookAppointment',
						action: 'Book an appointment',
						description:
							'Create a new appointment booking for a customer at a merchant\'s booking system. Automatically polls for job completion.',
					},
					{
						name: 'Get Availability',
						value: 'getAvailability',
						action: 'Get available appointment slots',
						description:
							'Retrieve a list of available time slots for appointments within a specified date range. Automatically polls for job completion.',
					},
				],
				default: 'bookAppointment',
			},
			...bookAppointmentDescription,
			...getAvailabilityDescription,
		],
	};

	async execute(this: IExecuteFunctions) {
		const operation = this.getNodeParameter('operation', 0) as string;
		const resource = this.getNodeParameter('resource', 0) as string;

		if (resource === 'booking') {
			if (operation === 'bookAppointment') {
				return executeBookAppointment.call(this);
			}
			if (operation === 'getAvailability') {
				return executeGetAvailability.call(this);
			}
		}

		throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation} for resource: ${resource}`);
	}
}

