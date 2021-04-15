/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import { assert } from "@bentley/bentleyjs-core";
import { CurrentImdlVersion, ElementGraphicsRequestProps } from "@bentley/imodeljs-common";
import { ElementGraphicsStatus } from "@bentley/imodeljs-native";
import { GeometricElement3d, SnapshotDb } from "../../imodeljs-backend";
import { IModelTestUtils } from "../IModelTestUtils";

describe("ElementGraphics", () => {
  let imodel: SnapshotDb;

  before(() => {
    imodel = IModelTestUtils.createSnapshotFromSeed(IModelTestUtils.prepareOutputFile("ElementGraphics", "mirukuru.ibim"), IModelTestUtils.resolveAssetFile("mirukuru.ibim"));
  });

  after(() => {
    if (imodel && imodel.isOpen)
      imodel.close();
  });

  it("obtains graphics for elements", async () => {
    const elementId = "0x29";
    const element = imodel.elements.tryGetElement<GeometricElement3d>(elementId);
    expect(element).not.to.be.undefined;
    expect(element).instanceof(GeometricElement3d);

    const request: ElementGraphicsRequestProps = {
      id: "test",
      elementId,
      toleranceLog10: -2,
      formatVersion: CurrentImdlVersion.Major,
    };

    const result = await imodel.nativeDb.generateElementGraphics(request);
    expect(result.status).to.equal(ElementGraphicsStatus.Success);
    assert(result.status === ElementGraphicsStatus.Success);

    const content = result.content;
    expect(content).not.to.be.undefined;
    expect(content instanceof Uint8Array).to.be.true;
    expect(content.length).least(40);
  });

  it("produces expected errors", async () => {
    type TestCase = [ ElementGraphicsStatus, Partial<ElementGraphicsRequestProps> ];
    const testCases: TestCase[] = [
      [ ElementGraphicsStatus.ElementNotFound, { elementId: "0" } ],
      [ ElementGraphicsStatus.ElementNotFound, { elementId: "0x12345678" } ],
      [ ElementGraphicsStatus.ElementNotFound, { elementId: undefined } ],

      [ ElementGraphicsStatus.InvalidJson, { id: undefined } ],
      [ ElementGraphicsStatus.InvalidJson, { toleranceLog10: undefined } ],

      [ ElementGraphicsStatus.InvalidJson, { toleranceLog10: 12.5 } ],
      [ ElementGraphicsStatus.InvalidJson, { toleranceLog10: "tol" as any } ],

      [ ElementGraphicsStatus.Success, { formatVersion: undefined } ],
      [ ElementGraphicsStatus.UnknownMajorFormatVersion, { formatVersion: CurrentImdlVersion.Major + 1 } ],
      [ ElementGraphicsStatus.UnknownMajorFormatVersion, { formatVersion: "latest" as any } ],
    ];

    for (const testCase of testCases) {
      const request: ElementGraphicsRequestProps = {
        id: "test",
        elementId: "0x29",
        toleranceLog10: -2,
        formatVersion: CurrentImdlVersion.Major,
        ...testCase[1],
      };

      const result = await imodel.nativeDb.generateElementGraphics(request);
      expect(result.status).to.equal(testCase[0]);
      if (result.status === ElementGraphicsStatus.Success)
        expect(result.content).not.to.be.undefined;
    }
  });
});
