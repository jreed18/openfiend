/**
 * NOTION TOOL — Bob's Soul integration
 *
 * Main entry point that re-exports all Notion functionality.
 * Import like: import * as notion from '@backend/tools/notion'
 */

// Client & setup
export { getNotionClient, isNotionConfigured } from './client';
export { initializeNotionWorkspace } from './setup';

// Decisions functions
export { writeDecision, readPendingDecisions, updateDecisionStatus, recoverStaleDecisions } from './sections/decisions';

// Memory functions
export { writeMemory, readWill, readMemoriesBySession } from './sections/memory';

// Autopsies functions
export { writeAutopsy, readRecentAutopsies } from './sections/autopsies';

// Threats functions
export { writeThreat, readRecentThreats } from './sections/threats';

// Shadow functions
export { writeShadowObservation, readShadowObservations, markShadowAsEnabled } from './sections/shadow';

// Tasks functions
export { writeTask, readPendingTasks, updateTaskStatus, recoverStaleTasks } from './sections/tasks';

// Mind functions
export { customizeMind } from './sections/mind';
