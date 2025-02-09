# Video Generation Process Documentation

This document provides a comprehensive overview of the video generation pipeline—from fetching a Gutenberg book to delivering a fully processed, multi-track video with auto-generated captions. The pipeline interconnects multiple modules including text parsing, AI-assisted section extraction, video generation via Replicate, S3 storage, audio track creation per CEFR level, and integration with Mux for playback and captions.

---

## Overview

1. **Fetch Gutenberg Book**
   Retrieve the full text from Project Gutenberg using node-fetch with Safari-like headers. Verify that the book is not already in the database before processing.

2. **Parse and Split Book into Sections**
   Strip the Project Gutenberg header and footer, extract metadata, and then split the main content into sections using overlapping chunks and an AI (LLM) powered processor.

3. **AI Video Generation**
   Feed the parsed and sectioned text into an AI video generation engine (via Replicate). Store the generated video file in S3 storage.

4. **Audio Track Generation and Language Tracks**
   Choose a target language and generate separate audio tracks for each supported CEFR level (A1, A2, B1, B2, C1, C2).

5. **Mux Asset Integration and Autocaptions**
   Upload the audio tracks to Mux, storing the corresponding asset ID and playback ID; then initiate Mux’s autocaptions process. Wait for the caption-ready webhook to update the database before enabling captions.

---

## Detailed Process

### 1. Fetch Gutenberg Book

- **Module Involved:** `lib/gutenberg/import.ts`
- **Process:**
  - Use a customized `fetch` call with Safari-like headers (User-Agent, Accept, etc.) to mimic browser requests.
  - Construct the URL using the Gutenberg book ID and a predetermined path.
  - Validate the HTTP response, throwing an error if the fetch fails.
  - Check if the book already exists in the database via a lookup in `schema.book`; if it does, return early with the existing book’s ID.

- **Edge Cases:**
  - **HTTP Errors:** Non-200 status codes should trigger error handling.
  - **Missing Book:** If the book isn’t found due to invalid Gutenberg ID.
  - **Incomplete Metadata:** Early errors if title, author, or language metadata is missing.

---

### 2. Parse and Split Book into Sections

- **Modules Involved:**
  - `lib/gutenberg/parse.ts`
  - `lib/gutenberg/import.ts`
  - `lib/ai/sections.ts`

- **Process:**
  - **Strip Header/Footer:**
    - Use `stripGutenbergText` to remove the header and footer.
    - This function uses markers such as `*** START OF THE PROJECT GUTENBERG EBOOK` and `*** END OF THE PROJECT GUTENBERG EBOOK`.
  - **Metadata Extraction:**
    - Leverage `parseGutenbergHeader` to extract title, author, and language.
    - Validate metadata existence and format; throw descriptive errors on failures.
  - **Section Extraction:**
    - Call `extractTextSections` to process the stripped text.
    - Split the text into overlapping chunks (configured with a chunk size, e.g., 32,000 characters).
    - Each chunk is augmented with line numbers (using a padded format) to maintain context.
    - A system prompt is sent to an LLM with strict instructions (see the defined system prompt in `lib/ai/sections.ts`) to produce an XML output of section boundaries.
    - Parse the XML into a JSON structure; adjust line numbers relative to the whole text.
    - Merge unnamed first sections with previous sections when necessary.
  - **Database Insertion:**
    - Perform the insertion of the book record and each corresponding section (`bookSection`) within a single Drizzle transaction.
    - Ensure transactional integrity (rollback if any insertion fails).

- **Edge Cases:**
  - **Invalid/Malformed XML:**
    - If the LLM returns invalid XML, log the error, skip the current chunk, and continue processing.
  - **Overlapping Chunks:**
    - Ensure overlapping regions do not cause duplicate section definitions; if the first section in a chunk is unnamed, merge it with the previous chunk’s section.
  - **Missing Section Boundaries:**
    - When no explicit chapter header is found, default to treating the initial continuous content as a single section.

---

### 3. AI Video Generation Using Replicate

- **Process:**
  - Once the book and its sections are stored, the processed text is provided to an AI video generation service via Replicate.
  - The service uses the text content (potentially structured by chapters) as a script or storyboard to generate a video.
  - The generated video file is then uploaded and stored in an Amazon S3 bucket.

- **Edge Cases:**
  - **Service Failure:**
    - Handle timeouts or errors during video generation.
  - **Upload Issues:**
    - Verify S3 upload success; implement retry logic if an upload fails.

---

### 4. Generate Language Tracks and Audio Processing

- **Process:**
  - **Language Selection:**
    - Choose a primary language for the video (this may be inferred from the Gutenberg metadata or user selection).
  - **CEFR Level Track Creation:**
    - For each level defined in the `cefrLevel` enum (A1, A2, B1, B2, C1, C2), create distinct audio tracks.
    - The audio tracks are generated using text-to-speech (or another audio rendering engine) tailored to each CEFR proficiency.
  - **Integration:**
    - All generated audio files are associated with the video record for later processing.

- **Edge Cases:**
  - **Audio Generation Failures:**
    - If any track fails to generate (due to API errors or insufficient data), log the failure and either retry or flag for manual intervention.
  - **Language Mismatches:**
    - Validate that the language code is supported and that the TTS engine correctly maps to the CEFR levels.

---

### 5. Upload Audio Tracks to Mux and Enable Autocaptions

- **Process:**
  - **Mux Ingestion:**
    - Push each generated audio track to Mux.
    - Store the resulting Mux asset ID and playback ID in the database (associated with the video record).
  - **Call Mux Autocaptions:**
    - Trigger Mux to generate autocaptions based on the ingested media.
  - **Webhook Monitoring:**
    - Wait for the Mux webhook payload (recorded in the `video_playback_event` table) to confirm the autocaptions have been successfully processed.
    - Once confirmed, enable the captions on the video.

- **Edge Cases:**
  - **API Failures:**
    - Handle any errors returned by Mux during ingestion, asset creation, or caption processing.
  - **Webhook Latency/Timeout:**
    - Implement mechanisms to retry or alert when the webhook is not received within an expected timeframe.
  - **Data Consistency:**
    - Ensure that the asset and playback IDs are correctly associated with the video; if the auto-caption webhook fails to update the record, do not enable video playback until resolved.

---

## Error Handling and Logging

- **Centralized Logging:**
  - Log every significant step such as HTTP requests, chunk processing, LLM responses, and API calls.
- **Transaction Rollbacks:**
  - Ensure all database operations (e.g., inserting book and sections) are wrapped in transactions to maintain consistency.
- **Validation Checks:**
  - Validate all external inputs (e.g., XML from LLM, API responses) before proceeding.
- **Retry Mechanisms:**
  - Build in retries for external service failures, such as fetching Gutenberg text, uploading to S3, or contacting Mux.

---

## Potential Improvements

- **Dynamic Chunk Sizing:**
  - Adapt chunk size based on book length or content density to improve LLM accuracy.
- **Advanced Section Merging:**
  - Refine how overlapping sections are merged to better handle ambiguous chapter boundaries.
- **Monitoring & Alerts:**
  - Integrate monitoring for webhook events and API calls to proactively address latency or errors.
- **User Feedback Integration:**
  - Allow users to flag sections or videos that may have inaccurate sectioning or captioning and trigger reprocessing.

---

## Summary

The video generation process involves several interconnected stages:

1. **Fetching & Parsing:** Start by retrieving and cleaning the Gutenberg text, followed by metadata extraction and AI-assisted sectioning.
2. **Video and Audio Generation:** Generate an AI video based on the structured text, then produce language-specific audio tracks for each CEFR level.
3. **Mux Integration:** Upload the media to Mux, trigger auto-captioning, and wait for confirmation via webhooks before enabling the final playback experience.

This end-to-end process ensures that each video is not only generated with high-quality visual and audio components but also enriched with multi-language support and automated captioning that meets accessibility standards.
