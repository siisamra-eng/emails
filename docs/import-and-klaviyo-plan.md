# Import and Klaviyo Integration Plan

This document describes the next implementation stage. Neither import nor Klaviyo sync is implemented in the current preview scaffold.

## Email library and importer

Provide one guided import flow for a campaign CSV and multiple matching `.html` or `.txt` files. Because the exact archive and its CSV columns are not available yet, let the user map source columns to campaign name, send date, offer, click metrics, attributed revenue, and content filename.

Show a preview before saving. Match assets by an explicit filename/path column first, then by normalized exact campaign name. Do not silently fuzzy-match. Let the user reassign files and fix rows; surface unmatched files or rows, duplicate candidates, invalid dates or numbers, and missing content. Allow metadata-only imports when content is missing. Preserve the source row and file, extract readable text for search and generation, and display imported HTML in an isolated preview.

Support manual competitor examples with source brand or URL, pasted HTML/text or notes, optional date/tags, and a user-controlled “worked well” flag. Keep competitor inspiration distinct from Carbinox campaign history. Use stable source identifiers and content hashes so re-importing does not silently create duplicates.

## Klaviyo read-only connection

Use a private Klaviyo API key with `campaigns:read` only. Store it as a Vercel environment secret and call Klaviyo only from authenticated server code. Never return or log the key. The UI should offer “Test connection” and “Sync campaigns” actions and explain authentication, permission, and rate-limit failures.

Use the stable campaigns endpoint with the required email channel filter, include message data, page through the returned cursor links, and store sent campaigns keyed by Klaviyo campaign/message IDs. Capture campaign name, send time, status, and sync time. Do not use the newer omni campaign hierarchy while it remains beta.

Campaign metadata does not provide performance statistics. Use Klaviyo’s Campaign Values Reporting API for unique clicks and attributed conversion value, grouped by campaign/message/channel. The account must choose a conversion metric; recommend Placed Order during setup, since its ID is account-specific. Show metrics as unavailable when the metric, permissions, or historical coverage do not provide them.

The campaign list allows pagination with up to 100 items per page. Reporting is substantially more limited than campaign listing (currently 2 requests/minute and 225/day, with a one-year maximum reporting window), so cache report results, sync incrementally, and batch campaign IDs where supported. Store `synced_at` and refresh only when needed. Treat current Klaviyo rate limits as implementation-time facts and recheck official documentation before coding.

## Offer rotation and data behavior

Parse product/offer tokens from campaign names with configurable aliases or patterns. Show unknown and ambiguous detections for correction; never hide the original campaign name. Use sent time as the history order and recommend an offer outside the recent-use window, while allowing the user to choose any offer.

Default the advisory recent-use window to the last 30 days and make it configurable. This is a recommendation, not a sending restriction. Historical CSV rows may enrich campaign history and link to email examples by an explicit campaign key.

## Open inputs before implementation

- Inspect a representative archive CSV and a few email files to configure useful initial column mappings and matching rules.
- During Klaviyo setup, let the user select the account-specific conversion metric; preselect Placed Order when available.
- Verify current API version requirements, response shapes, scopes, and rate limits against official Klaviyo docs during implementation.
