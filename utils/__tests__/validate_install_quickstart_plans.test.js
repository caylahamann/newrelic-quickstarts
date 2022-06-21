'use strict';

import {
  validateInstallPlanIds,
} from '../validate-quickstart-install-plans';
import Quickstart from '../lib/Quickstart';
import InstallPlan from '../lib/InstallPlan';
import * as githubHelpers from '../lib/github-api-helpers';

jest.mock('@actions/core');
jest.spyOn(global.console, 'error').mockImplementation(() => {});

jest.mock('../lib/github-api-helpers', () => ({
  ...jest.requireActual('../lib/github-api-helpers'),
  filterQuickstartConfigFiles: jest.fn(),
}));

jest.mock('../lib/Quickstart', () => {
  return {default: jest.fn().mockImplementation(() => {
    return {
      config: {installPlans: ['test-id']},
      isValid: true,
    };
  })};
});

jest.mock('../lib/InstallPlan', () => {
  return { default: jest.fn().mockImplementation(() => {
    return {
      isValid: true,
    };
  })};
});

const validQuickstartFilename = 'quickstarts/mock-quickstart-2/config.yml';
const invalidQuickstartFilename1 = 'quickstarts/mock-quickstart-1/config.yml';
const invalidQuickstartFilename2 = 'quickstarts/mock-quickstart-3/config.yml';
const validQuickstartWithoutInstallPlan = 'quickstarts/mock-quickstart-5/config.yml';

const mockGithubAPIFiles = (filenames) =>
  filenames.map((filename) => ({
    sha: '',
    filename: `utils/mock_files/${filename}`,
    status: 'added',
    additions: 0,
    deletions: 0,
    changes: 0,
    blob_url: '',
    raw_url: '',
    contents_url: '',
    patch: '',
  }));

describe('Action: validate install plan id', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('succeeds with valid install plan id', () => {
    const files = mockGithubAPIFiles([validQuickstartFilename]);
    githubHelpers.filterQuickstartConfigFiles.mockReturnValueOnce(files);

    validateInstallPlanIds(files);
    expect(global.console.error).not.toHaveBeenCalled();
  });

  test(`succeeds when valid quickstart doesn't contain any install plan`, () => {
    const files = mockGithubAPIFiles([validQuickstartWithoutInstallPlan]);
    githubHelpers.filterQuickstartConfigFiles.mockReturnValueOnce(files);

    validateInstallPlanIds(files);
    expect(global.console.error).not.toHaveBeenCalled();
  });

  test.only('fails with invalid install plan id', () => {
    const files = mockGithubAPIFiles([invalidQuickstartFilename1]);
    InstallPlan.mockImplementation(() => {
      return { default: jest.fn().mockImplementation(() => {
        return {
          isValid: true,
        };
      })}
    });
    githubHelpers.filterQuickstartConfigFiles.mockReturnValueOnce(files);

    validateInstallPlanIds(files);
    expect(global.console.error).toHaveBeenCalledTimes(4);
  });

  test('fails with one invalid and one install plan id for singular quickstart', () => {
    const files = mockGithubAPIFiles([invalidQuickstartFilename2]);
    githubHelpers.filterQuickstartConfigFiles.mockReturnValueOnce(files);

    validateInstallPlanIds(files);
    expect(global.console.error).toHaveBeenCalledTimes(4);
  });

  test('fails with mix of valid and invalid quickstart', () => {
    const files = mockGithubAPIFiles([
      invalidQuickstartFilename1,
      invalidQuickstartFilename2,
      validQuickstartFilename,
    ]);
    githubHelpers.filterQuickstartConfigFiles.mockReturnValueOnce(files);

    validateInstallPlanIds(files);
    expect(global.console.error).toHaveBeenCalledTimes(5);
  });

  test('does not fail for deleted quickstart', () => {
    const removedQuickstartFilename = 'fake-removed-quickstart/config.yml';
    const files = mockGithubAPIFiles([removedQuickstartFilename]);
    files[0].status = 'removed';
    githubHelpers.filterQuickstartConfigFiles.mockReturnValueOnce(files);

    validateInstallPlanIds(files);
    expect(global.console.error).toHaveBeenCalledTimes(0);
  });
});
