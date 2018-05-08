/*---------------------------------------------------------------------------------------------
|  $Copyright: (c) 2018 Bentley Systems, Incorporated. All rights reserved. $
 *--------------------------------------------------------------------------------------------*/
/** @module RpcInterface */
import { RpcInterface, RpcManager, IModelToken } from "@bentley/imodeljs-common";
import { IModelUnitTestRpcInterface } from "@bentley/imodeljs-common/lib/rpc/IModelUnitTestRpcInterface"; // not part of the "barrel"
import { IModelDb } from "../IModelDb";

/**
 * The backend implementation of IModelUnitTestRpcInterface.
 * @hidden
 */
export class IModelUnitTestRpcImpl extends RpcInterface implements IModelUnitTestRpcInterface {
  public static register() { RpcManager.registerImpl(IModelUnitTestRpcInterface, IModelUnitTestRpcImpl); }
  public async executeTest(iModelToken: IModelToken, testName: string, params: any): Promise<any> { return IModelDb.find(iModelToken).executeTest(testName, params); }
}
