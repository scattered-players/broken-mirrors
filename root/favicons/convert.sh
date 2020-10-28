#!/bin/bash -ex

types=(actor admin attendee guide)

for t in "${types[@]}"; do
  echo $t
  convert "${t}-ios.png" -resize 152x152 "${t}-touch-icon-ipad.png"
  convert "${t}-ios.png" -resize 180x180 "${t}-touch-icon-iphone-retina.png"
  convert "${t}-ios.png" -resize 120x120 "${t}-touch-icon-ipad-retina.png"
done