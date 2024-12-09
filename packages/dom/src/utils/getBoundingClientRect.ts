import type {ClientRectObject} from '@floating-ui/core';
import {rectToClientRect} from '@floating-ui/core';
import {createCoords} from '@floating-ui/utils';
import {getComputedStyle, getWindow} from '@floating-ui/utils/dom';

import {getScale} from '../platform/getScale';
import {isElement} from '../platform/isElement';
import {getVisualOffsets, shouldAddVisualOffsets} from './getVisualOffsets';
import {unwrapElement} from './unwrapElement';
import type {VirtualElement} from '../types';
import { getFrameElement } from '@floating-ui/utils/dom';

export function getBoundingClientRect(
  element: Element | VirtualElement,
  includeScale = false,
  isFixedStrategy = false,
  offsetParent?: Element | Window,
): ClientRectObject {
  const clientRect = element.getBoundingClientRect();
  const domElement = unwrapElement(element);

  let scale = createCoords(1);
  if (includeScale) {
    if (offsetParent) {
      if (isElement(offsetParent)) {
        scale = getScale(offsetParent);
      }
    } else {
      scale = getScale(element);
    }
  }

  // Get CSS zoom
  const cssZoom = parseFloat(getComputedStyle(domElement).zoom) || 1;

  const visualOffsets = shouldAddVisualOffsets(
    domElement,
    isFixedStrategy,
    offsetParent,
  )
    ? getVisualOffsets(domElement)
    : createCoords(0);

  // Adapt positions and dimensions with the scale and zoom
  let x = (clientRect.left + visualOffsets.x) / (scale.x * cssZoom);
  let y = (clientRect.top + visualOffsets.y) / (scale.y * cssZoom);
  let width = clientRect.width / (scale.x * cssZoom);
  let height = clientRect.height / (scale.y * cssZoom);

  if (domElement) {
    const win = getWindow(domElement);
    const offsetWin =
      offsetParent && isElement(offsetParent)
        ? getWindow(offsetParent)
        : offsetParent;

    let currentWin = win;
    let currentIFrame = getFrameElement(currentWin);
    while (currentIFrame && offsetParent && offsetWin !== currentWin) {
      const iframeScale = getScale(currentIFrame);
      const iframeRect = currentIFrame.getBoundingClientRect();
      const css = getComputedStyle(currentIFrame);
      const left =
        iframeRect.left +
        (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) *
          iframeScale.x;
      const top =
        iframeRect.top +
        (currentIFrame.clientTop + parseFloat(css.paddingTop)) *
          iframeScale.y;

      x *= iframeScale.x;
      y *= iframeScale.y;
      width *= iframeScale.x;
      height *= iframeScale.y;

      x += left;
      y += top;

      currentWin = getWindow(currentIFrame);
      currentIFrame = getFrameElement(currentWin);
    }
  }

  return rectToClientRect({width, height, x, y});
}
