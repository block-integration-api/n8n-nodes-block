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

export async function executeGetAvailability(
	this: IExecuteFunctions,
): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const connectionId = this.getNodeParameter('connectionId', i) as string;
			const startDate = this.getNodeParameter('startDate', i) as string;
			const endDate = this.getNodeParameter('endDate', i) as string;
			const pollInterval = (this.getNodeParameter('pollInterval', i, 2) as number) || 2;
			const pollTimeout = (this.getNodeParameter('pollTimeout', i, 180) as number) || 180;

			// Build payload
			const payload: IDataObject = {
				startDate,
				endDate,
			};

			// Optional fields
			const provider = this.getNodeParameter('provider', i, '') as string;
			if (provider) {
				payload.provider = provider;
			}

			const duration = this.getNodeParameter('duration', i, '') as number | string;
			if (duration) {
				payload.duration = typeof duration === 'number' ? duration : parseInt(duration, 10);
			}

			// Business hours (optional)
			const businessHoursData = this.getNodeParameter('businessHours', i, {}) as IDataObject;
			const businessHours = businessHoursData.businessHours as IDataObject | undefined;
			if (businessHours?.start) {
				payload.businessHours = {
					start: businessHours.start,
					end: businessHours.end,
				};
			}

			// Call actions endpoint
			const actionResponse = (await blockApiRequest.call(this, 'POST', '/v1/actions', {
				action: 'GetAvailability',
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

