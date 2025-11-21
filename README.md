# n8n-nodes-block

This is an n8n community node for the Block API. It enables you to book appointments and check availability across various booking platforms directly from your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

### Booking Resource

- **Book Appointment** - Book an appointment at a merchant's booking system
  - Requires connection ID, datetime, provider, service, and customer information
  - Supports optional fields like duration, note, timezone, and service address
  - Automatically polls for job completion with configurable intervals and timeouts

- **Get Availability** - Query available appointment slots
  - Requires connection ID, start date, and end date
  - Supports optional filters like provider, duration, and business hours
  - Returns available time slots for the specified date range

## Credentials

### Block API Credentials

To use this node, you need to configure Block API credentials:

1. **API Key** - Your Block API key (required)
   - Obtain your API key from the Block developer portal
   - The API key is used for Bearer token authentication
   - The node uses the repo-configured Block API base URL automatically

### Setting Up Credentials

1. In n8n, add a new credential of type "Block API"
2. Enter your API key (Generated at https://www.useblock.tech/dev)
3. Test the connection to verify your credentials are valid

For more information about obtaining API keys and setting up connections, visit the [Block API documentation](https://www.useblock.tech/docs).

## Compatibility

Compatible with n8n@1.60.0 or later

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Block API documentation](https://www.useblock.tech/docs)
