/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
/** @module Geometry */

import { Id64String } from "@bentley/bentleyjs-core";
import {
  Point3d,
  Range3d,
  Transform,
  XYZProps,
} from "@bentley/geometry-core";

/** JSON representation of the 4 corners of an [[ImageGraphicProps]].
 * @beta
 */
export interface ImageGraphicCornersProps {
  0: XYZProps;
  1: XYZProps;
  2: XYZProps;
  3: XYZProps;
}

/** JSON representation of an [[ImageGraphic].
 * @see [[GeometryStreamEntryProps]].
 * @beta
 */
export interface ImageGraphicProps {
  /** The 4 corners of defining the rectangle on which the image is displayed. */
  corners: ImageGraphicCornersProps;
  /** The Id of the persistent [[Texture]] element defining the image to be displayed on the rectangle. */
  textureId: Id64String;
  /** Whether or not to draw a border around the image. */
  hasBorder: boolean;
}

/** Defines the 4 corners of an [[ImageGraphic]].
 * @beta
 */
export class ImageGraphicCorners {
  public readonly 0: Point3d;
  public readonly 1: Point3d;
  public readonly 2: Point3d;
  public readonly 3: Point3d;

  public constructor(p0: Point3d, p1: Point3d, p2: Point3d, p3: Point3d) {
    this[0] = p0;
    this[1] = p1;
    this[2] = p2;
    this[3] = p3;
  }

  public static fromJSON(props: ImageGraphicCornersProps): ImageGraphicCorners {
    return new ImageGraphicCorners(Point3d.fromJSON(props[0]), Point3d.fromJSON(props[1]), Point3d.fromJSON(props[2]), Point3d.fromJSON(props[3]));
  }

  public static from4Points(points: [Point3d, Point3d, Point3d, Point3d]): ImageGraphicCorners {
    return new ImageGraphicCorners(points[0], points[1], points[2], points[3]);
  }

  public clone(): ImageGraphicCorners {
    return new ImageGraphicCorners(this[0].clone(), this[1].clone(), this[2].clone(), this[3].clone());
  }

  public toJSON(): ImageGraphicCornersProps {
    return { 0: this[0].toJSON(), 1: this[1].toJSON(), 2: this[2].toJSON(), 3: this[3].toJSON() };
  }
}

/** A geometric primitive that displays an image mapped to the corners of a rectangle, with an optional border.
 * The image is always displayed regardless of [[RenderMode]] or [[ViewFlags]], and is displayed without lighting.
 * @beta
 */
export class ImageGraphic {
  /** The 4 corners of defining the rectangle on which the image is displayed. */
  public readonly corners: ImageGraphicCorners;
  /** The Id of the persistent [[Texture]] element defining the image to be displayed on the rectangle. */
  public readonly textureId: Id64String;
  /** Whether or not to draw a border around the image. */
  public readonly hasBorder: boolean;

  /** Construct a new ImageGraphic.
   * @param corners Defines the 4 corners of the rectangle on which the image is to be displayed. The ImageGraphic takes ownership of this input.
   * @param textureId Identifies a persistent [[Texture]] element defining the image to be mapped onto the rectangle.
   * @param hasBorder Whether or not to display a border around the image.
   */
  public constructor(corners: ImageGraphicCorners, textureId: Id64String, hasBorder = false) {
    this.corners = corners;
    this.textureId = textureId;
    this.hasBorder = hasBorder;
  }

  public static fromJSON(props: ImageGraphicProps): ImageGraphic {
    const corners = ImageGraphicCorners.fromJSON(props.corners);
    return new ImageGraphic(corners, props.textureId, props.hasBorder);
  }

  public clone(): ImageGraphic {
    return new ImageGraphic(this.corners.clone(), this.textureId, this.hasBorder);
  }

  public cloneTransformed(transform: Transform): ImageGraphic {
    const clone = this.clone();
    clone.transformInPlace(transform);
    return clone;
  }

  public toJSON(): ImageGraphicProps {
    return {
      corners: this.corners.toJSON(),
      textureId: this.textureId,
      hasBorder: this.hasBorder,
    };
  }

  /** Computes and returns the range.
   * @param result If supplied, will be modified to hold the computed range and returned.
   * @returns The computed range.
   */
  public computeRange(result?: Range3d): Range3d {
    if (undefined === result)
      result = new Range3d();
    else
      result.setNull();

    result.extend(this.corners[0], this.corners[1], this.corners[2], this.corners[3]);
    return result;
  }

  /** Apply a transform to the corners of the rectangle. */
  public transformInPlace(transform: Transform): void {
    transform.multiplyPoint3d(this.corners[0], this.corners[0]);
    transform.multiplyPoint3d(this.corners[1], this.corners[1]);
    transform.multiplyPoint3d(this.corners[2], this.corners[2]);
    transform.multiplyPoint3d(this.corners[3], this.corners[3]);
  }
}
