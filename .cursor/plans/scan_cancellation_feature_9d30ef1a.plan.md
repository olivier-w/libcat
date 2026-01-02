---
name: Scan Cancellation Feature
overview: Add the ability to cancel an in-progress folder scan by implementing a cancellation token pattern across the main process, IPC layer, and renderer UI.
todos:
  - id: main-cancel-handler
    content: Add scanCancelled flag and scan:cancel IPC handler in main.ts
    status: completed
  - id: preload-api
    content: Add cancelScan() and onScanCancelled() to preload.ts
    status: completed
    dependencies:
      - main-cancel-handler
  - id: scan-modal-ui
    content: Add Cancel button and cancelling state to ScanModal.tsx
    status: completed
    dependencies:
      - preload-api
  - id: app-integration
    content: Wire up cancel event handling in App.tsx
    status: completed
    dependencies:
      - preload-api
---

# Scan Cancellation Feature

## Overview

Currently, once a scan starts there is no way to stop it. This plan adds a "Cancel" button to the scan modal that will abort the scan mid-operation, keeping any movies already processed while stopping further processing.

## Architecture

```mermaid
sequenceDiagram
    participant UI as ScanModal
    participant Store as libraryStore
    participant IPC as preload.ts
    participant Main as main.ts
    participant Scanner as FileScanner

    UI->>IPC: cancelScan()
    IPC->>Main: scan:cancel
    Main->>Main: Set scanCancelled = true
    Main-->>IPC: { cancelled: true }
    Main->>UI: scan:cancelled event
    UI->>Store: setIsScanning(false)
```

## Key Changes

### 1. Main Process ([`electron/main.ts`](electron/main.ts))

- Add a `scanCancelled` flag variable
- Add `scan:cancel` IPC handler that sets the flag and returns acknowledgment
- Modify the `folder:scan` loop to check `scanCancelled` after each file
- When cancelled, send a `scan:cancelled` event and return partial results
- Reset the flag at the start of each new scan

### 2. Preload ([`electron/preload.ts`](electron/preload.ts))

- Add `cancelScan()` method that invokes `scan:cancel`
- Add `onScanCancelled(callback)` listener for the cancelled event
- Update type definitions

### 3. Scan Modal ([`src/components/ScanModal.tsx`](src/components/ScanModal.tsx))

- Add a "Cancel" button below the progress bar
- Wire button to call `window.api.cancelScan()`
- Show "Cancelling..." state while waiting for confirmation

### 4. App Component ([`src/App.tsx`](src/App.tsx))

- Subscribe to `scan:cancelled` event to clean up UI state
- Handle partial results (movies already added before cancel)

## Behavior

- Movies processed before cancellation are kept in the library
- Cancellation is near-instant (checked between each file)
- UI shows "Cancelling..." briefly while the current file finishes
- Toast message indicates scan was cancelled with count of files added