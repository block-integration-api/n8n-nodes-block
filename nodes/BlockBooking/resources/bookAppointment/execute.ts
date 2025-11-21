import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { blockApiRequest } from '../../shared/transport';

async function pollJobStatus(
	this: IExecuteFunctions,
	jobId: string,
	pollInterval: number,
	pollTimeout: number,
): Promise<IDataObject> {
	const startTime = Date.now();
	const timeoutMs = pollTimeout * 1000;
	const intervalMs = pollInterval * 1000;

	while (true) {
		const elapsed = Date.now() - startTime;
		if (elapsed >= timeoutMs) {
			throw new Error(
				`Job polling timed out after ${pollTimeout} seconds. Job ID: ${jobId}. Check job status manually.`,
			);
		}

		try {
			const jobStatus = (await blockApiRequest.call(
				this,
				'GET',
				`/v1/jobs/${jobId}`,
			)) as IDataObject;

			const status = jobStatus.status as string | undefined;
			if (status === 'success') {
				return jobStatus;
			}

			if (status === 'error') {
				const errorCode = jobStatus.errorCode || 'unknown_error';
				const errorMessage = jobStatus.errorMessage || 'Job failed';
				throw new Error(
					`Job failed with status 'error'. Job ID: ${jobId}, Error Code: ${errorCode}, Message: ${errorMessage}`,
				);
			}

			// Job still in progress (queued, leased, in_progress, waiting_2fa)
			if (intervalMs > 0) {
				const endTime = Date.now() + intervalMs;
				while (Date.now() < endTime) {
					// Busy-wait microtask yield to avoid tight loop
					await Promise.resolve();
				}
			}
		} catch (error: unknown) {
			// If it's our own error (timeout or job error), rethrow it
			if (error instanceof Error && error.message.includes('Job polling timed out')) {
				throw error;
			}
			if (error instanceof Error && error.message.includes('Job failed')) {
				throw error;
			}

			// For other errors, log and continue polling
			// This handles transient network errors
			if (intervalMs > 0) {
				const endTime = Date.now() + intervalMs;
				while (Date.now() < endTime) {
					await Promise.resolve();
				}
			}
		}
	}
}

export async function executeBookAppointment(
	this: IExecuteFunctions,
): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const connectionId = this.getNodeParameter('connectionId', i) as string;
			const datetime = this.getNodeParameter('datetime', i) as string;
			const provider = this.getNodeParameter('provider', i) as string;
			const service = this.getNodeParameter('service', i) as string;
			const customerData = this.getNodeParameter('customer', i) as IDataObject;
			const pollInterval = (this.getNodeParameter('pollInterval', i, 2) as number) || 2;
			const pollTimeout = (this.getNodeParameter('pollTimeout', i, 180) as number) || 180;

			// Build customer object from fixedCollection
			const customer: IDataObject = {
				firstName: (customerData.customer as IDataObject | undefined)?.firstName || '',
				lastName: (customerData.customer as IDataObject | undefined)?.lastName || '',
				phone: (customerData.customer as IDataObject | undefined)?.phone || '',
			};
			if ((customerData.customer as IDataObject | undefined)?.email) {
				customer.email = (customerData.customer as IDataObject).email;
			}

			// Build payload
			const payload: IDataObject = {
				datetime,
				provider,
				service,
				customer,
			};

			// Optional fields
			const duration = this.getNodeParameter('duration', i, '') as number | string;
			if (duration) {
				payload.duration = typeof duration === 'number' ? duration : parseInt(duration, 10);
			}

			const note = this.getNodeParameter('note', i, '') as string;
			if (note) {
				payload.note = note;
			}

			const timezone = this.getNodeParameter('timezone', i, '') as string;
			if (timezone) {
				payload.timezone = timezone;
			}

			// Service address (optional)
			const serviceAddressData = this.getNodeParameter('serviceAddress', i, {}) as IDataObject;
			const serviceAddress = serviceAddressData.serviceAddress as IDataObject | undefined;
			if (serviceAddress?.address) {
				payload.serviceAddress = {
					address: serviceAddress.address,
					city: serviceAddress.city,
					state: serviceAddress.state,
					zipCode: serviceAddress.zipCode,
					country: serviceAddress.country,
				} as IDataObject;
				if (serviceAddress.room) {
					(payload.serviceAddress as IDataObject).room = serviceAddress.room;
				}
			}

			// Call actions endpoint
			const actionResponse = (await blockApiRequest.call(this, 'POST', '/v1/actions', {
				action: 'BookAppointment',
				connectionId,
				payload,
			})) as IDataObject;

			const jobId = actionResponse.jobId as string | undefined;
			if (!jobId) {
				throw new Error('No jobId returned from actions endpoint');
			}

			// Poll for job completion
			const jobResult = await pollJobStatus.call(this, jobId, pollInterval, pollTimeout);

			returnData.push({
				json: jobResult,
				pairedItem: { item: i },
			});
		} catch (error: unknown) {
			if (this.continueOnFail()) {
				returnData.push({
					json: {
						error: error instanceof Error ? error.message : 'Unknown error',
					},
					pairedItem: { item: i },
				});
				continue;
			}
			throw error;
		}
	}

	return [returnData];
}

