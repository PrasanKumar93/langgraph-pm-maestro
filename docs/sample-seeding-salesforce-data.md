# Sample Seeding Salesforce Data

## Overview

This guide explains how to populate your Salesforce instance with sample data for testing purposes.

## Available Resources

### API Endpoint

- Use the [seedSalesforce](./apis/seed-salesforce.md) API to populate sample data

### Data Sources

- Sample data definitions are located in:
  - [`salesforce-data.ts`](../src/data/salesforce-data.ts)

### Object Information

- Primary object: `TechnicalRequest__c`
  - Object name is defined in [`constants.ts`](../src/utils/constants.ts) under `SALESFORCE_OBJECTS.TechnicalRequest`

## Usage

To populate your Salesforce instance with sample data, simply call the seedSalesforce API endpoint. This will create test records using the predefined data templates.

## Sample Search query in .env

```sh
SF_SEARCH_FEATURE_QUERY="FIND {SEARCH_FIELD} IN ALL FIELDS RETURNING TechnicalRequest__c(Id, Name, painPoint__c, featureRequestDetails__c, potentialDealSize__c, industry__c, priority__c, currentWorkaround__c, businessImpact__c)"
```
