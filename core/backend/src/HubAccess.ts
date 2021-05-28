/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module HubAccess
 */

import { GuidString, Id64String } from "@bentley/bentleyjs-core";
import { LockLevel, LockType } from "@bentley/imodelhub-client";
import { CodeProps, IModelVersion } from "@bentley/imodeljs-common";
import { AuthorizedClientRequestContext } from "@bentley/itwin-client";
import { BriefcaseDb } from "./IModelDb";

export type LocalFileName = string;
export type LocalDirName = string;
export type ChangesetId = string;
export type ChangesetIndex = number;

/** Properties of a changeset
 * @internal
 */
export interface ChangesetProps {
  id: ChangesetId;
  parentId: ChangesetId;
  changesType: number;
  description: string;
  briefcaseId: number;
  pushDate?: string;
  userCreated?: string;
  size?: number;
  index?: ChangesetIndex;
}

/** Properties of a changeset file
 * @internal
 */
export interface ChangesetFileProps extends ChangesetProps {
  pathname: LocalFileName;
}

export type ChangesetRange = { first: ChangesetId, after?: never, end?: ChangesetId } | { after: ChangesetId, first?: never, end?: ChangesetId };

/**
 * The properties of an iModel server lock.
 * @beta
 */
export interface LockProps {
  type: LockType;
  objectId: Id64String;
  level: LockLevel;
}

export interface IModelIdArg {
  iModelId: GuidString;
  requestContext?: AuthorizedClientRequestContext;
}

export interface BriefcaseDbArg {
  requestContext?: AuthorizedClientRequestContext;
  briefcase: BriefcaseDb;
}

export interface BriefcaseIdArg extends IModelIdArg {
  briefcaseId: number;
}

export interface HubAccess {
  downloadChangesets: (arg: IModelIdArg & { range?: ChangesetRange }) => Promise<ChangesetFileProps[]>;
  downloadChangeset: (arg: IModelIdArg & { id: ChangesetId }) => Promise<ChangesetFileProps>;
  queryChangeset: (arg: IModelIdArg & { id: ChangesetId }) => Promise<ChangesetProps>;
  queryChangesets: (arg: IModelIdArg & { range?: ChangesetRange }) => Promise<ChangesetProps[]>;
  pushChangeset: (arg: IModelIdArg & { changesetProps: ChangesetFileProps, releaseLocks: boolean }) => Promise<void>;
  getLatestChangesetId: (arg: IModelIdArg) => Promise<string>;
  getChangesetIdFromNamedVersion: (arg: IModelIdArg & { versionName: string }) => Promise<string>;
  getChangesetIdFromVersion: (arg: IModelIdArg & { version: IModelVersion }) => Promise<string>;

  /** Get the index of the change set from its id */
  getChangesetIndexFromId: (arg: IModelIdArg & { changesetId: ChangesetId }) => Promise<ChangesetIndex>;
  /** Acquire a new briefcaseId for the supplied iModelId
     * @note usually there should only be one briefcase per iModel per user.
     */
  acquireNewBriefcaseId: (arg: IModelIdArg) => Promise<number>;
  /** Release a briefcaseId. After this call it is illegal to generate changesets for the released briefcaseId. */
  releaseBriefcase: (arg: BriefcaseIdArg) => Promise<void>;

  getMyBriefcaseIds: (arg: IModelIdArg) => Promise<number[]>;

  acquireLocks: (arg: BriefcaseDbArg & { locks: LockProps[] }) => Promise<void>;
  getAllLocks: (arg: BriefcaseDbArg) => Promise<LockProps[]>;
  getAllCodes: (arg: BriefcaseDbArg) => Promise<CodeProps[]>;
  releaseAllLocks: (arg: BriefcaseIdArg) => Promise<void>;
  releaseAllCodes: (arg: BriefcaseIdArg) => Promise<void>;

  createIModel: (arg: { requestContext?: AuthorizedClientRequestContext, contextId: GuidString, iModelName: string, description?: string, revision0?: LocalFileName }) => Promise<GuidString>;
  deleteIModel: (arg: { requestContext?: AuthorizedClientRequestContext, contextId: GuidString, iModelId: GuidString }) => Promise<void>;
  queryIModelByName: (arg: { requestContext?: AuthorizedClientRequestContext, contextId: GuidString, iModelName: string }) => Promise<GuidString | undefined>;
}

