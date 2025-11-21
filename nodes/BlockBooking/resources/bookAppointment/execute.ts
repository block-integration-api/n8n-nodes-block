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
					'The appointment booking job did not complete within the specified timeout period. Increase the "Poll Timeout (Seconds)" parameter or check the job status manually using the job ID.',
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
				const errorMessage = jobStatus.errorMessage || 'The booking job could not be completed';
				throw new NodeOperationError(this.getNode(), {
					message: `Booking job could not be completed. Job ID: ${jobId}, Code: ${errorCode}`,
					description: `${errorMessage}. Verify the connection ID, appointment details, and customer information are correct, then try again.`,
				});
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
				throw new NodeOperationError(this.getNode(), {
					message: 'No job ID returned from the booking service',
					description:
						'The booking service did not return a job ID. Verify your connection ID and API credentials are correct, then try again.',
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
							: 'An unexpected issue occurred while booking the appointment';
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
				message: 'An unexpected issue occurred while booking the appointment',
				description:
					error instanceof Error
						? error.message
						: 'Please verify your connection ID, appointment details, and API credentials, then try again.',
			});
		}
	}

	return [returnData];
}

