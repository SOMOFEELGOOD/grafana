import React from 'react';

import { selectors } from '@grafana/e2e-selectors';
import { isFetchError } from '@grafana/runtime';
import { Dashboard } from '@grafana/schema';
import { Alert, Box, Button, Stack } from '@grafana/ui';

import { DashboardScene } from '../scene/DashboardScene';
import { transformSceneToSaveModel } from '../serialization/transformSceneToSaveModel';
import { Diffs, jsonDiff } from '../settings/version-history/utils';

export interface DashboardChangeInfo {
  changedSaveModel: Dashboard;
  initialSaveModel: Dashboard;
  diffs: Diffs;
  diffCount: number;
  hasChanges: boolean;
  hasTimeChanged: boolean;
  hasVariableValuesChanged: boolean;
  isNew?: boolean;
}

export function getSaveDashboardChange(dashboard: DashboardScene, saveTimeRange?: boolean): DashboardChangeInfo {
  const initialSaveModel = dashboard.getInitialSaveModel()!;
  const changedSaveModel = transformSceneToSaveModel(dashboard);
  const hasTimeChanged = getHasTimeChanged(changedSaveModel, initialSaveModel);
  const hasVariableValuesChanged = getVariableValueChanges(changedSaveModel, initialSaveModel);

  if (!saveTimeRange) {
    changedSaveModel.time = initialSaveModel.time;
  }

  const diff = jsonDiff(initialSaveModel, changedSaveModel);

  let diffCount = 0;
  for (const d of Object.values(diff)) {
    diffCount += d.length;
  }

  return {
    changedSaveModel,
    initialSaveModel,
    diffs: diff,
    diffCount,
    hasChanges: diffCount > 0,
    hasTimeChanged,
    isNew: changedSaveModel.version === 0,
    hasVariableValuesChanged,
  };
}

function getHasTimeChanged(saveModel: Dashboard, originalSaveModel: Dashboard) {
  return saveModel.time?.from !== originalSaveModel.time?.from || saveModel.time?.to !== originalSaveModel.time?.to;
}

function getVariableValueChanges(saveModel: Dashboard, originalSaveModel: Dashboard) {
  return false;
}

export function isVersionMismatchError(error?: Error) {
  return isFetchError(error) && error.data && error.data.status === 'version-mismatch';
}

export function isNameExistsError(error?: Error) {
  return isFetchError(error) && error.data && error.data.status === 'name-exists';
}

export function isPluginDashboardError(error?: Error) {
  return isFetchError(error) && error.data && error.data.status === 'plugin-dashboard';
}

export interface NameAlreadyExistsErrorProps {
  cancelButton: React.ReactNode;
  saveButton: (overwrite: boolean) => React.ReactNode;
}

export function NameAlreadyExistsError({ cancelButton, saveButton }: NameAlreadyExistsErrorProps) {
  return (
    <Alert title="Name already exists" severity="error">
      <p>
        A dashboard with the same name in selected folder already exists. Would you still like to save this dashboard?
      </p>
      <Box paddingTop={2}>
        <Stack alignItems="center">
          {cancelButton}
          {saveButton(true)}
        </Stack>
      </Box>
    </Alert>
  );
}

export interface SaveButtonProps {
  overwrite: boolean;
  onSave: (overwrite: boolean) => void;
  isLoading: boolean;
  isValid?: boolean;
}

export function SaveButton({ overwrite, isLoading, isValid, onSave }: SaveButtonProps) {
  return (
    <Button
      disabled={!isValid || isLoading}
      icon={isLoading ? 'spinner' : undefined}
      aria-label={selectors.pages.SaveDashboardModal.save}
      onClick={() => onSave(overwrite)}
      variant={overwrite ? 'destructive' : 'primary'}
    >
      {isLoading ? 'Saving...' : overwrite ? 'Save and overwrite' : 'Save'}
    </Button>
  );
}
