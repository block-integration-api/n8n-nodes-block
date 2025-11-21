import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
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
			throw new NodeOperationError(this.getNode(), {
				message: `Job polling timed out after ${pollTimeout} seconds. Job ID: ${jobId}`,
				description:
					'The availability check job did not complete within the specified timeout period. Increase the "Poll Timeout (Seconds)" parameter or check the job status manually using the job ID.',
			});
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
				const errorMessage = jobStatus.errorMessage || 'The availability check job could not be completed';
				throw new NodeOperationError(this.getNode(), {
					message: `Availability check job could not be completed. Job ID: ${jobId}, Code: ${errorCode}`,
					description: `${errorMessage}. Verify the connection ID and date range are correct, then try again.`,
				});
			}

			// Job still in progress (queued, leased, in_progress, waiting_2fa)
			if (intervalMs > 0) {
				const endTime = Date.now() + intervalMs;
				while (Date.now() < endTime) {
					await Promise.resolve();
				}
			}
		} catch (error: unknown) {
			// If it's our own NodeOperationError (timeout or job error), rethrow it
			if (error instanceof NodeOperationError) {
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
				throw new NodeOperationError(this.getNode(), {
					message: 'No job ID returned from the availability service',
					description:
						'The availability service did not return a job ID. Verify your connection ID and API credentials are correct, then try again.',
				});
			}

			// Poll for job completion
			const jobResult = await pollJobStatus.call(this, jobId, pollInterval, pollTimeout);

			returnData.push({
				json: jobResult,
				pairedItem: { item: i },
			});
		} catch (error: unknown) {
			if (this.continueOnFail()) {
				const errorMessage =
					error instanceof NodeOperationError
						? error.message
						: error instanceof Error
							? error.message
							: 'An unexpected issue occurred while checking availability';
				returnData.push({
					json: {
						error: errorMessage,
					},
					pairedItem: { item: i },
				});
				continue;
			}
			if (error instanceof NodeOperationError) {
				throw error;
			}
			throw new NodeOperationError(this.getNode(), {
				message: 'An unexpected issue occurred while checking availability',
				description:
					error instanceof Error
						? error.message
						: 'Please verify your connection ID, date range, and API credentials, then try again.',
			});
		}
	}

	return [returnData];
}

