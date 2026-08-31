import {
  BARCODE_GUIDE_REGION,
  LIVE_NUMBER_GUIDE_REGION,
} from './assetCodeOcr'

export { BARCODE_GUIDE_REGION, LIVE_NUMBER_GUIDE_REGION }

export const toGuideBoxStyle = (region) => ({
  left: `${region.leftRatio * 100}%`,
  top: `${region.topRatio * 100}%`,
  width: `${region.widthRatio * 100}%`,
  height: `${region.heightRatio * 100}%`,
})

export const toGuideTextTop = (region, offsetPx = 26) => (
  `calc(${region.topRatio * 100}% - ${offsetPx}px)`
)
