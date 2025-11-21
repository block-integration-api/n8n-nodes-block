# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-XX

### Added

- Initial release of n8n-nodes-block
- Block Booking node with the following operations:
  - Book Appointment: Create a new appointment booking for a customer at a merchant's booking system
  - Get Availability: Retrieve available appointment slots within a specified date range
- Block API credentials support for authentication
- Automatic job polling with configurable intervals and timeouts
- Support for customer information, service details, and optional fields (duration, notes, timezone, service address)
- Support for availability filtering by provider, duration, and business hours
