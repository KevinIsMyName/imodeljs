/*---------------------------------------------------------------------------------------------
|  $Copyright: (c) 2018 Bentley Systems, Incorporated. All rights reserved. $
 *--------------------------------------------------------------------------------------------*/
import { assert } from "chai";
import { BisCore, Element, InformationPartitionElement, IModelDb, ConcurrencyControl, GeometricElement3d, ECSqlStatement, PhysicalPartition } from "@bentley/imodeljs-backend";
import { IModelTestUtils } from "./IModelTestUtils";
import { ElementProps, AxisAlignedBox3d, CodeSpec, CodeScopeSpec, IModel } from "@bentley/imodeljs-common";
import { Id64, DbResult } from "@bentley/bentleyjs-core";
import { AccessToken } from "@bentley/imodeljs-clients/lib/Token";
import { Range3dProps } from "@bentley/geometry-core";

/** Example code organized as tests to make sure that it builds and runs successfully. */
describe("Example Code", () => {
  let iModel: IModelDb;
  let accessToken: AccessToken;

  before(async () => {
    iModel = IModelTestUtils.openIModel("test.bim");
    accessToken = await IModelTestUtils.getTestUserAccessToken();
  });

  after(() => {
    iModel.close(accessToken);
  });

  /** Gives example code something to call. */
  const doSomethingWithString = (s: string) => {
    assert.exists(s);
  };

  // __PUBLISH_EXTRACT_START__ IModelDbModels.createModel
  function createNewModel(parentElement: Element, modelName: string, isModelPrivate: boolean): Id64 {

    const outputImodel = parentElement.iModel;

    // The modeled element's code
    const modelCode = InformationPartitionElement.createCode(parentElement, modelName);

    //  The modeled element
    const modeledElementProps: ElementProps = {
      classFullName: "BisCore:PhysicalPartition",
      iModel: outputImodel,
      parent: { id: parentElement.id, relClassName: "BisCore:SubjectOwnsPartitionElements" },
      model: IModel.repositoryModelId,
      code: modelCode,
    };
    const modeledElement: Element = outputImodel.elements.createElement(modeledElementProps);
    const modeledElementId: Id64 = outputImodel.elements.insertElement(modeledElement);

    // The model
    const newModel = outputImodel.models.createModel({ modeledElement: modeledElementId, classFullName: "BisCore:PhysicalModel", isPrivate: isModelPrivate });
    const newModelId = outputImodel.models.insertModel(newModel);
    assert.isTrue(newModelId.isValid());

    return modeledElementId;
  }
  // __PUBLISH_EXTRACT_END__

  it("should update the imodel project extents", async () => {
    // __PUBLISH_EXTRACT_START__ IModelDb.updateProjectExtents
    // This is an example of how to expand an iModel's project extents.
    const originalExtents = iModel.projectExtents;
    const newExtents = new AxisAlignedBox3d(originalExtents.low, originalExtents.high);
    newExtents.low.x -= 50; newExtents.low.y -= 25; newExtents.low.z -= 189;
    newExtents.high.x += 1087; newExtents.high.y += 19; newExtents.high.z += .001;
    iModel.updateProjectExtents(newExtents);
    // __PUBLISH_EXTRACT_END__
  });

  it("should extract working example code", async () => {
    // __PUBLISH_EXTRACT_START__ BisCore.registerSchemaAndGetClass
    // Register any schemas that will be used directly
    BisCore.registerSchema();

    // Get the class for the specified class name
    const elementClass = BisCore.getClass(Element.name, iModel);
    if (elementClass === undefined) {
      assert.fail();
      return;
    }

    // Do something with the returned element class
    doSomethingWithString(elementClass.schema.name);
    doSomethingWithString(elementClass.name);
    // __PUBLISH_EXTRACT_END__

    // __PUBLISH_EXTRACT_START__ ConcurrencyControl.setPolicy
    // Turn on optimistic concurrency control.
    // This allows the app to modify elements, models, etc. without first acquiring locks.
    // Later, when the app downloads and merges changeSets from iModelHub,
    // IModelDb's ConcurrencyControl will merge changes and handle conflicts,
    // as specified by this policy.
    iModel.concurrencyControl.setPolicy(new ConcurrencyControl.OptimisticPolicy());
    // __PUBLISH_EXTRACT_END__

    // __PUBLISH_EXTRACT_START__ ConcurrencyControl_Codes.reserve
    try {
      await iModel.concurrencyControl.codes.reserve(accessToken);
    } catch (err) {
      if (err instanceof ConcurrencyControl.RequestError) {
        // Do something about err.unavailableCodes ...
      }
    }
    // __PUBLISH_EXTRACT_END__

    // Create a modeled element and a model.
    const newModeledElementId = createNewModel(iModel.elements.getRootSubject(), "newModelCode", false);

    // __PUBLISH_EXTRACT_START__ ConcurrencyControl.request
    // Now acquire all locks and reserve all codes needed.
    // This is a *prequisite* to saving local changes.
    try {
      await iModel.concurrencyControl.request(accessToken);
    } catch (err) {
      // If we can't get *all* of the locks and codes that are needed,
      // then we can't go on with this transaction as is.
      // We could possibly make additional changes to remove the need
      // for the resources that are unavailable. In this case,
      // we will just bail out and print a message.
      iModel.abandonChanges();
      // report error ...
    }
    // Now we can commit the local changes to a local transaction in the
    // IModelDb.
    // __PUBLISH_EXTRACT_END__

    // Now we can commit the local changes to a local transaction in the
    // IModelDb.
    iModel.saveChanges("inserted generic objects");

    assert.isTrue(newModeledElementId !== undefined);

    // assertions to ensure example code is working properly
    assert.equal(BisCore.name, elementClass.schema.name);
    assert.equal(Element.name, elementClass.name);
  });

  it("should create and insert CodeSpecs", () => {
    const testImodel = iModel;

    // __PUBLISH_EXTRACT_START__ CodeSpecs.insert
    // Create and insert a new CodeSpec with the name "CodeSpec1". In this example, we choose to make a model-scoped CodeSpec.
    const codeSpec: CodeSpec = new CodeSpec(testImodel, new Id64(), "CodeSpec1", CodeScopeSpec.Type.Model);
    const codeSpecId: Id64 = testImodel.codeSpecs.insert(codeSpec);
    assert.deepEqual(codeSpecId, codeSpec.id);

    // Should not be able to insert a duplicate.
    try {
      const codeSpecDup: CodeSpec = new CodeSpec(testImodel, new Id64(), "CodeSpec1", CodeScopeSpec.Type.Model);
      testImodel.codeSpecs.insert(codeSpecDup); // throws in case of error
      assert.fail();
    } catch (err) {
      // We expect this to fail.
    }

    // We should be able to insert another CodeSpec with a different name.
    const codeSpec2: CodeSpec = new CodeSpec(testImodel, new Id64(), "CodeSpec2", CodeScopeSpec.Type.Model, CodeScopeSpec.ScopeRequirement.FederationGuid);
    const codeSpec2Id: Id64 = testImodel.codeSpecs.insert(codeSpec2);
    assert.deepEqual(codeSpec2Id, codeSpec2.id);
    assert.notDeepEqual(codeSpec2Id, codeSpecId);
    // __PUBLISH_EXTRACT_END__

  });

  it("should execute spatial queries", () => {

    // __PUBLISH_EXTRACT_START__ Model.lookupByCode
    const partitionCode = PhysicalPartition.createCode(iModel.elements.getRootSubject(), "DefaultModel");
    const partitionId: Id64 | undefined = iModel.elements.queryElementIdByCode(partitionCode);
    // __PUBLISH_EXTRACT_END__
    assert.isTrue(partitionId !== undefined);
    if (partitionId === undefined)
      return;
    const modelId = iModel.models.getSubModel(partitionId).id;
    assert.isTrue(modelId !== undefined);

    // __PUBLISH_EXTRACT_START__ EcsqlGeometryFunctions.iModel_bbox_areaxy
    // Compute the largest element area in the X-Y plane.
    let maxArea: number = 0;
    iModel.withPreparedStatement(`SELECT iModel_bbox_areaxy(iModel_bbox(BBoxLow.X,BBoxLow.Y,BBoxLow.Z,BBoxHigh.X,BBoxHigh.Y,BBoxHigh.Z)) FROM ${GeometricElement3d.classFullName}`,
      (stmt: ECSqlStatement) => {
        while (stmt.step() === DbResult.BE_SQLITE_ROW) {
          const thisArea: number = stmt.getValue(0).getDouble();
          if (thisArea > maxArea)
            maxArea = thisArea;
        }
      });
    // Report the result
    reportArea(maxArea);

    // Use the standard SUM operator to accumulate the results of the iModel_bbox_areaxy function. This shows that
    // ECSQL treats the built-in geometry functions as normal expressions.
    const areaSum: number = iModel.withPreparedStatement(`SELECT SUM(iModel_bbox_areaxy(iModel_bbox(BBoxLow.X,BBoxLow.Y,BBoxLow.Z,BBoxHigh.X,BBoxHigh.Y,BBoxHigh.Z))) FROM ${GeometricElement3d.classFullName}`,
      (stmt: ECSqlStatement) => {
        if (stmt.step() !== DbResult.BE_SQLITE_ROW)
          return 0; // ?
        return stmt.getValue(0).getDouble();
      });
    // Report the result
    reportArea(areaSum);

    // __PUBLISH_EXTRACT_END__

    // __PUBLISH_EXTRACT_START__ EcsqlGeometryFunctions.iModel_bbox_union
    // This is an example of accumlating the union of bounding boxes.
    // Note that when computing a union, it only makes sense to use axis-aligned bounding boxes, not element-aligned bounding boxes.
    const bboxUnionStmtECSQL = `
      SELECT
        iModel_bbox_union(
          iModel_placement_aabb(
            iModel_placement(
              iModel_point(g.Origin.X, g.Origin.Y, g.Origin.Z),
              iModel_angles(g.Yaw, g.Pitch, g.Roll),
              iModel_bbox(g.BBoxLow.X, g.BBoxLow.Y, g.BBoxLow.Z, g.BBoxHigh.X, g.BBoxHigh.Y, g.BBoxHigh.Z)
            )
          )
        )
      FROM ${Element.classFullName} AS e, ${GeometricElement3d.classFullName} AS g
        WHERE e.model.id=? AND e.ecinstanceid=g.ecinstanceid
    `;

    const rangeSum: Range3dProps = iModel.withPreparedStatement(bboxUnionStmtECSQL,
      (stmt: ECSqlStatement) => {
        stmt.bindId(1, modelId);
        if (stmt.step() !== DbResult.BE_SQLITE_ROW)
          return {} as Range3dProps;
        const r = stmt.getRow();
        return r as Range3dProps;
      });
    reportRange(rangeSum);
    // __PUBLISH_EXTRACT_END__

    // This is an example of passing the WRONG TYPE of object to iModel_bbox_areaxy and getting an error.
    // This statement is wrong, because iModel_placement_angles returns a iModel_angles object, while iModel_bbox_areaxy expects a DGN_bbox object.
    // Note that the error is detected when you try to step the statement, not when you prepare it.
    iModel.withPreparedStatement("SELECT iModel_bbox_areaxy(iModel_angles(Yaw,Pitch,Roll)) FROM " + GeometricElement3d.classFullName,
      (stmt: ECSqlStatement) => {
        // TODO: I expect an exception here:
        while (stmt.step() === DbResult.BE_SQLITE_ROW) {
          // ...
        }
      });
  });

});

function reportArea(a: number) {
  a;
}
function reportRange(a: Range3dProps) {
  a;
}
